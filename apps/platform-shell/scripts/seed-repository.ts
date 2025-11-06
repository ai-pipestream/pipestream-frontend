#!/usr/bin/env tsx
import { createHash } from 'crypto'
import { createReadStream, promises as fs } from 'fs'
import { basename, relative, resolve, isAbsolute, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@connectrpc/connect'
import { createGrpcTransport } from '@connectrpc/connect-node'
import { NodeUploadService, PipeDocService } from '@pipeline/proto-stubs'

async function sha256(filePath: string): Promise<string> {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (d) => hash.update(d))
    stream.on('error', reject)
    stream.on('end', () => resolveHash(hash.digest('hex')))
  })
}

type Options = {
  dirs: string[]
  drive: string
  concurrency: number
  baseUrl: string
  target: string
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = resolve(dir, e.name)
    if (e.isDirectory()) {
      yield* walk(p)
    } else if (e.isFile()) {
      yield p
    }
  }
}

async function uploadFile(filePath: string, relPath: string, opts: Options) {
  // Use gRPC transport directly to repository service (bypass web-proxy for testing)
  const transport = createGrpcTransport({ baseUrl: 'http://localhost:38102' })
  const upload = createClient(NodeUploadService as any, transport) as any
  const repo = createClient(PipeDocService, transport)

  // Read file content
  const data = await fs.readFile(filePath)

  // Initiate upload
  console.log(`Calling initiateUpload for ${relPath}...`);
  const init = await upload.initiateUpload({
    drive: opts.drive,
    parentId: '',
    name: basename(relPath),
    metadata: {},
    expectedSize: BigInt(data.byteLength),
    mimeType: undefined,
    connectorId: 'seed-cli',
  })
  
  console.log(`InitiateUpload succeeded! NodeId: ${init.nodeId}, UploadId: ${init.uploadId}`);

  // Upload as single chunk (optimize later for large files)
  console.log(`Attempting uploadChunks for ${relPath}...`);
  
  try {
    const result = await upload.uploadChunks((async function* () {
      console.log('Generator: About to yield chunk');
      yield { 
        nodeId: init.nodeId, 
        uploadId: init.uploadId, 
        data: new Uint8Array(data), 
        chunkNumber: BigInt(1), 
        isLast: true 
      };
      console.log('Generator: Yielded chunk');
    })());
    
    console.log('UploadChunks succeeded:', result);
  } catch (error) {
    console.error('UploadChunks failed:', error);
    throw error;
  }

  // Create stored PipeDoc with minimal metadata
  const resp = await repo.savePipeDoc({
    pipedoc: {
      source: { path: relPath },
      searchMetadata: { title: basename(relPath) },
    },
    drive: opts.drive,
    connectorId: 'seed-cli',
    metadata: { path: relPath },
  } as any)

  return resp
}

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const repoRoot = resolve(__dirname, '../../../..')
  const args = process.argv.slice(2)
  const dirs: string[] = []
  let drive = 'pipedocs-drive'
  let concurrency = 4
  let baseUrl = process.env.PROXY_BASE_URL || 'http://localhost:38106/connect'
  const target = 'repository-service'

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--dir' && args[i + 1]) { dirs.push(args[++i]) }
    else if (a === '--drive' && args[i + 1]) { drive = args[++i] }
    else if (a === '--concurrency' && args[i + 1]) { concurrency = Number(args[++i]) || 4 }
    else if (a === '--base-url' && args[i + 1]) { baseUrl = args[++i] }
  }

  if (dirs.length === 0) {
    console.error('Usage: pnpm run seed:repo -- --dir <path> [--dir <path>] [--drive pipdoc-test-data] [--concurrency 4] [--base-url http://localhost:38106/connect]')
    process.exit(1)
  }

  // Collect files, compute hashes for dedupe across dirs
  const seenHashes = new Set<string>()
  const files: { abs: string, rel: string }[] = []
  for (const d of dirs) {
    const absDir = isAbsolute(d) ? d : resolve(repoRoot, d)
    for await (const p of walk(absDir)) {
      const hash = await sha256(p)
      if (seenHashes.has(hash)) continue
      seenHashes.add(hash)
      files.push({ abs: p, rel: relative(absDir, p) })
    }
  }

  console.log(`Seeding ${files.length} unique files to drive '${drive}' via ${baseUrl}`)

  let ok = 0, fail = 0
  const results: any[] = []

  const queue = [...files]
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length) {
      const item = queue.shift()!
      try {
        const r = await uploadFile(item.abs, item.rel, { dirs, drive, concurrency, baseUrl, target })
        ok++
        results.push({ file: item.rel, nodeId: (r as any)?.nodeId })
        console.log(`✔ Uploaded ${item.rel}`)
      } catch (e: any) {
        fail++
        console.warn(`✖ Failed ${item.rel}: ${e?.message || e}`)
        if (e?.code || e?.details) {
          console.warn(`  Error details: code=${e.code}, details=${e.details}`)
        }
      }
    }
  })

  await Promise.all(workers)

  const summary = { attempted: files.length, uploaded: ok, failed: fail }
  console.log(JSON.stringify({ summary, results }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
