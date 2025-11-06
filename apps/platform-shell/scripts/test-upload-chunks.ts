import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createConnectTransport } from '@connectrpc/connect-node'
import { createClient } from '@connectrpc/connect'
import { NodeUploadService } from '../src/generated/repository/filesystem/upload/upload_service_pb.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const filePath = process.argv[2]
  const drive = process.argv[3] || 'modules-drive'
  if (!filePath) {
    console.error('Usage: pnpm run test:upload:dev -- <path-to-file> [drive]')
    process.exit(1)
  }
  const absPath = path.resolve(process.cwd(), filePath)
  const stat = fs.statSync(absPath)
  if (!stat.isFile()) {
    console.error('Not a file:', absPath)
    process.exit(1)
  }

  const transport = createConnectTransport({ baseUrl: 'http://localhost:38106' })
  const client = createClient(NodeUploadService, transport)

  const name = path.basename(absPath)
  console.log('Initiating upload:', { drive, name, size: stat.size })
  const init = await client.initiateUpload({
    drive,
    parentId: '',
    name,
    metadata: {},
    expectedSize: BigInt(stat.size),
    mimeType: 'application/octet-stream',
  })
  console.log('Initiated:', init)

  ;(async () => {
    try {
      for await (const p of client.streamUploadProgress({ nodeId: init.nodeId })) {
        const pct = Number(p.totalBytes) > 0 ? (Number(p.bytesUploaded) * 100) / Number(p.totalBytes) : p.percent
        console.log(`Progress: state=${p.state} uploaded=${p.bytesUploaded}/${p.totalBytes} (${pct.toFixed(1)}%)`)
      }
      console.log('Progress stream completed')
    } catch (e) {
      console.error('Progress stream error:', e)
    }
  })()

  const CHUNK_SIZE = 512 * 1024
  let chunkNumber = 0
  const stream = fs.createReadStream(absPath, { highWaterMark: CHUNK_SIZE })

  async function* makeRequests() {
    for await (const buf of stream) {
      chunkNumber += 1
      yield {
        nodeId: init.nodeId,
        uploadId: init.uploadId,
        data: new Uint8Array(buf as Buffer),
        chunkNumber: BigInt(chunkNumber),
        isLast: false,
      }
    }
    yield {
      nodeId: init.nodeId,
      uploadId: init.uploadId,
      data: new Uint8Array(),
      chunkNumber: BigInt(chunkNumber),
      isLast: true,
    }
  }

  console.log('Uploading chunks...')
  const result = await client.uploadChunks(makeRequests())
  console.log('UploadChunks result:', result)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
