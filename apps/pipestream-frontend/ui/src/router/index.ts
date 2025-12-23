import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// Platform routes - core platform pages
const platformRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/health',
    name: 'health',
    component: () => import('../pages/HealthPage.vue'),
  },
  {
    path: '/modules',
    name: 'modules-page',
    component: () => import('../pages/ModulesPage.vue'),
  },
  {
    path: '/modules/:name',
    name: 'module-config',
    component: () => import('../pages/ModulesPage.vue'),
  },
  {
    path: '/links',
    name: 'links',
    component: () => import('../pages/LinksPage.vue'),
  },
  {
    path: '/components',
    name: 'components',
    component: () => import('../pages/ComponentsPage.vue'),
  },
  {
    path: '/opensearch-manager',
    name: 'opensearch-manager',
    component: () => import('../pages/OpenSearchPage.vue'),
  },
];

// Service routes - application services (long-running)
const serviceRoutes: RouteRecordRaw[] = [
  {
    path: '/accounts',
    name: 'accounts',
    component: () => import('../services/account-manager/src/App.vue'),
    children: [
      {
        path: '',
        name: 'accounts-list',
        component: () => import('../services/account-manager/src/views/AccountListView.vue'),
      },
      {
        path: 'create',
        name: 'accounts-create',
        component: () => import('../services/account-manager/src/views/AccountCreateView.vue'),
      },
      {
        path: 'edit/:accountId',
        name: 'accounts-edit',
        component: () => import('../services/account-manager/src/views/AccountEditView.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/admin-connector',
    name: 'connectors',
    component: () => {
      console.log('[Router] Loading connector-admin component');
      return import('../services/connector-service/src/App.vue');
    },
    children: [
      {
        path: '',
        name: 'connectors-list',
        component: () => import('../services/connector-service/src/views/ConnectorListView.vue'),
      },
      {
        path: 'create',
        name: 'connectors-create',
        component: () => import('../services/connector-service/src/views/ConnectorCreateView.vue'),
      },
      {
        path: 'edit/:connectorId',
        name: 'connectors-edit',
        component: () => import('../services/connector-service/src/views/ConnectorEditView.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/filesystem-connector',
    name: 'filesystem-connector',
    component: () => import('../pages/FilesystemConnectorPage.vue'),
  },
  {
    path: '/mapping',
    name: 'mapping',
    component: () => import('../services/mapping-service/src/App.vue'),
    children: [],
  },
  {
    path: '/opensearch',
    name: 'opensearch',
    component: () => import('../services/opensearch-manager/src/App.vue'),
    children: [],
  },
  {
    path: '/registration',
    name: 'registration',
    component: () => import('../services/platform-registration/src/App.vue'),
    children: [],
  },
  {
    path: '/repository',
    name: 'repository',
    component: () => import('../services/repo-service/src/App.vue'),
    children: [
      {
        path: '',
        name: 'repository-dashboard',
        component: () => import('../services/repo-service/src/views/DashboardView.vue'),
      },
      {
        path: 'search',
        name: 'repository-search',
        component: () => import('../services/repo-service/src/views/SearchView.vue'),
      },
      {
        path: 'documents',
        name: 'repository-documents',
        component: () => import('../services/repo-service/src/views/DocumentsView.vue'),
      },
      {
        path: 'import-export',
        name: 'repository-import-export',
        component: () => import('../services/repo-service/src/views/ImportExportView.vue'),
      },
    ],
  },
];

// Pipeline module routes - processing components
const pipelineModuleRoutes: RouteRecordRaw[] = [
  {
    path: '/modules/chunker',
    name: 'chunker',
    component: () => import('../pipeline-modules/chunker/src/App.vue'),
    children: [],
  },
  {
    path: '/modules/echo',
    name: 'echo',
    component: () => import('../pipeline-modules/echo/src/App.vue'),
    children: [],
  },
  {
    path: '/modules/embedder',
    name: 'embedder',
    component: () => import('../pipeline-modules/embedder/src/App.vue'),
    children: [],
  },
  {
    path: '/modules/parser',
    name: 'parser',
    component: () => import('../pipeline-modules/parser/src/App.vue'),
    children: [],
  },
];

const routes: RouteRecordRaw[] = [
  ...platformRoutes,
  ...serviceRoutes,
  ...pipelineModuleRoutes,
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
