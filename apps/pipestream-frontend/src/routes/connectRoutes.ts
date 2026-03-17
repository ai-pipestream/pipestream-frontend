import { ConnectRouter, Code, ConnectError } from "@connectrpc/connect";
import { createClient } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";
import { create } from "@bufbuild/protobuf";
import {
  OpenSearchManagerService,
  PipeDocService,
  PlatformRegistrationService,
  Health,
  ShellService,
  SearchDocumentsResponseSchema,
  GetDocumentDetailsResponseSchema,
  ListUiModulesResponseSchema,
  GetUiModuleConfigSchemaResponseSchema,
  ListUiServicesResponseSchema,
  WatchHealthResponse
} from "@ai-pipestream/protobuf-forms/generated";
import { createDynamicTransport, resolveService, getRegistrationTransport } from "../lib/serviceResolver.js";

export default (router: ConnectRouter) => {
  // Shell Service: Unified BFF Implementation
  router.service(ShellService, {
    /**
     * watchHealth: Aggregated health stream for all discovered services.
     */
    async *watchHealth(_req: any, context: any) {
      const nowIso = () => new Date().toISOString();
      const prClient = createClient(PlatformRegistrationService, getRegistrationTransport());
      
      let services: Array<{ serviceName: string }>; 
      try {
        const list = await prClient.listServices({});
        services = (list.services ?? []).map(s => ({
          serviceName: (s as any).serviceName ?? "",
        }));
      } catch (err) {
        console.error("[Shell] Failed to list services:", err);
        services = [];
      }

      const controller = new AbortController();
      const abort = () => controller.abort();
      try {
        // @ts-ignore
        context?.signal?.addEventListener?.("abort", abort);
      } catch {}

      const queue: WatchHealthResponse[] = [];
      let resolveNext: (() => void) | null = null;
      const nextPromise = () => new Promise<void>(r => (resolveNext = r));
      
      const emit = (u: any) => {
        queue.push(u);
        if (resolveNext) {
          resolveNext();
          resolveNext = null;
        }
      };

      const watchers = services.map(async ({ serviceName }) => {
        if (!serviceName || serviceName === 'consul') return;
        
        try {
          const transport = serviceName === "platform-registration-service" 
            ? getRegistrationTransport() 
            : createDynamicTransport(serviceName);
            
          const healthClient = createClient(Health, transport);
          for await (const resp of healthClient.watch({ service: "" }, { signal: controller.signal })) {
            emit({
              serviceName,
              displayName: serviceName,
              target: "dynamic",
              status: (resp as any).status ?? 0,
              observedAt: nowIso(),
            });
          }
        } catch (err) {
          emit({
            serviceName,
            displayName: serviceName,
            target: "dynamic",
            status: 0,
            observedAt: nowIso(),
          });
        }
      });

      while (!controller.signal.aborted) {
        while (queue.length > 0) {
          yield queue.shift()!;
        }
        await nextPromise();
      }
      try { await Promise.allSettled(watchers); } catch {}
    },

    /**
     * searchDocuments: Facade for OpenSearchManagerService.SearchDocumentUploads.
     */
    async searchDocuments(req) {
      console.log(`[Shell] Searching documents: "${req.query}"`);
      try {
        const transport = createDynamicTransport("opensearch-manager");
        const client = createClient(OpenSearchManagerService, transport);
        
        const backendResponse = await client.searchDocumentUploads({
          query: req.query,
          pageSize: req.pageSize,
          pageToken: req.pageToken,
          connectorId: req.connectorId,
          mimeType: req.mimeType,
        });

        return create(SearchDocumentsResponseSchema, {
          results: backendResponse.results,
          totalCount: backendResponse.totalCount,
          nextPageToken: backendResponse.nextPageToken
        });
      } catch (error) {
        console.error("[Shell] searchDocuments failed:", error);
        throw new ConnectError("Search failed", Code.Internal);
      }
    },

    /**
     * getDocumentDetails: Facade for PipeDocService.GetPipeDoc.
     */
    async getDocumentDetails(req) {
      console.log(`[Shell] Fetching document details: ${req.docId}`);
      try {
        const transport = createDynamicTransport("repository-service");
        const client = createClient(PipeDocService, transport);
        
        const response = await client.getPipeDoc({
          nodeId: req.docId
        });

        return create(GetDocumentDetailsResponseSchema, {
          document: response.pipedoc
        });
      } catch (error) {
        console.error("[Shell] getDocumentDetails failed:", error);
        throw new ConnectError("Document retrieval failed", Code.Internal);
      }
    },

    /**
     * listUiServices: Aggregates from PlatformRegistrationService.
     */
    async listUiServices(_req) {
      try {
        const client = createClient(PlatformRegistrationService, getRegistrationTransport());
        const resp = await client.listServices({});
        const serviceNames = (resp.services ?? []).map((s: any) => s.serviceName);
        return create(ListUiServicesResponseSchema, { serviceNames });
      } catch (error) {
        console.error("[Shell] listUiServices failed:", error);
        throw new ConnectError("Failed to list services", Code.Internal);
      }
    },

    /**
     * listUiModules: Aggregates from PlatformRegistrationService.
     */
    async listUiModules(_req) {
      try {
        const client = createClient(PlatformRegistrationService, getRegistrationTransport());
        const resp = await client.listPlatformModules({});
        const moduleNames = (resp.modules ?? []).map((m: any) => m.moduleName || m.serviceName);
        return create(ListUiModulesResponseSchema, { moduleNames });
      } catch (error) {
        console.error("[Shell] listUiModules failed:", error);
        throw new ConnectError("Failed to list modules", Code.Internal);
      }
    },

    /**
     * getUiModuleConfigSchema: Resolves specific module and gets its registration.
     */
    async getUiModuleConfigSchema(req) {
      try {
        const transport = createDynamicTransport(req.moduleName);
        const { PipeStepProcessorService } = await import("@ai-pipestream/protobuf-forms/generated");
        const client = createClient(PipeStepProcessorService, transport);
        const reg = await client.getServiceRegistration({});
        return create(GetUiModuleConfigSchemaResponseSchema, {
          jsonConfigSchema: reg.jsonConfigSchema
        });
      } catch (error) {
        console.error("[Shell] getUiModuleConfigSchema failed:", error);
        throw new ConnectError("Failed to get module schema", Code.Internal);
      }
    }
  });

  console.log("Connect routes initialized with unified ShellService BFF");
  return router;
};
