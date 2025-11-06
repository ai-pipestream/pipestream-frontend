<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Filesystem Connector</h1>
        <p class="text-body-1 mb-6">
          Upload files and folders to the Pipeline repository using the filesystem connector.
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Upload File</v-card-title>
          <v-card-text>
            <v-file-input
              v-model="selectedFile"
              label="Select file"
              prepend-icon="mdi-file"
              show-size
              accept="*/*"
              @change="onFileSelected"
            ></v-file-input>
            
            <v-text-field
              v-model="filePath"
              label="Or enter file path"
              prepend-icon="mdi-folder"
              class="mt-4"
            ></v-text-field>

            <v-btn
              color="primary"
              :disabled="!canUpload"
              :loading="uploading"
              @click="uploadFile"
              class="mt-4"
            >
              Upload File
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Upload Folder</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="folderPath"
              label="Folder path"
              prepend-icon="mdi-folder-multiple"
              class="mt-4"
            ></v-text-field>

            <v-select
              v-model="pattern"
              :items="PATTERN_OPTIONS"
              label="File pattern"
              prepend-icon="mdi-filter"
              class="mt-4"
            ></v-select>

            <v-text-field
              v-model.number="workers"
              label="Number of workers (parallel uploads)"
              type="number"
              min="1"
              max="10"
              prepend-icon="mdi-account-multiple"
              class="mt-4"
            ></v-text-field>

            <v-btn
              color="primary"
              :disabled="!folderPath"
              :loading="uploading"
              @click="uploadFolder"
              class="mt-4"
            >
              Upload Folder
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="uploadResult">
      <v-col cols="12">
        <v-alert
          :type="uploadResult.success ? 'success' : 'error'"
          :text="uploadResult.message"
        ></v-alert>
        
        <!-- Detailed Statistics -->
        <v-card v-if="uploadResult.stats" class="mt-4">
          <v-card-title>Upload Statistics</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" sm="3">
                <v-card variant="tonal" color="primary">
                  <v-card-text class="text-center">
                    <div class="text-h4">{{ uploadResult.stats.documentsFound }}</div>
                    <div class="text-caption">Files Found</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card variant="tonal" color="success">
                  <v-card-text class="text-center">
                    <div class="text-h4">{{ uploadResult.stats.documentsProcessed }}</div>
                    <div class="text-caption">Processed</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card variant="tonal" color="error">
                  <v-card-text class="text-center">
                    <div class="text-h4">{{ uploadResult.stats.documentsFailed }}</div>
                    <div class="text-caption">Failed</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card variant="tonal" color="info">
                  <v-card-text class="text-center">
                    <div class="text-h4">{{ formatBytes(uploadResult.stats.bytesProcessed) }}</div>
                    <div class="text-caption">Total Size</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Error Details -->
        <v-alert v-if="uploadResult.errors && uploadResult.errors.length > 0" type="warning" class="mt-4">
          <div class="text-h6 mb-2">Errors:</div>
          <ul class="mb-0">
            <li v-for="error in uploadResult.errors" :key="error">{{ error }}</li>
          </ul>
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="uploadProgress">
      <v-col cols="12">
        <v-card>
          <v-card-title>Upload Progress</v-card-title>
          <v-card-text>
            <v-progress-linear
              :model-value="uploadProgress.percentage"
              :color="uploadProgress.color"
              height="25"
            >
              <template v-slot:default>
                <strong>{{ uploadProgress.text }}</strong>
              </template>
            </v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Connector Status</v-card-title>
          <v-card-text>
            <v-chip
              :color="connectorStatus.initialized ? 'success' : 'warning'"
              class="mr-2"
            >
              {{ connectorStatus.initialized ? 'Initialized' : 'Not Initialized' }}
            </v-chip>
            <v-chip
              v-if="connectorStatus.sessionId"
              color="info"
            >
              Session: {{ connectorStatus.sessionId.substring(0, 8) }}...
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  UploadApiClient, 
  createUploadApiClient, 
  PATTERN_OPTIONS, 
  formatBytes,
  createProgressHandler,
  type UploadResult,
  type UploadStats
} from '@io-pipeline/connector-shared/browser';

const selectedFile = ref<File | null>(null);
const filePath = ref('');
const folderPath = ref('/tmp/test');
const pattern = ref('**/*');
const workers = ref(1);
const uploading = ref(false);
const uploadResult = ref<UploadResult | null>(null);
const uploadProgress = ref<{ percentage: number; text: string; color: string } | null>(null);
const connectorStatus = ref({ initialized: false, sessionId: null as string | null | undefined });

const canUpload = computed(() => {
  return (selectedFile.value !== null || filePath.value !== '') && !uploading.value;
});

// Initialize API client
const apiClient = createUploadApiClient({
  baseUrl: 'http://localhost:38106'
});

async function checkConnectorStatus() {
  try {
    const status = await apiClient.checkStatus();
    connectorStatus.value = {
      initialized: status.initialized,
      sessionId: status.sessionId || null
    };
  } catch (error) {
    console.error('Failed to check connector status:', error);
  }
}

async function uploadFile() {
  if (!selectedFile.value && !filePath.value) {
    return;
  }

  uploading.value = true;
  uploadResult.value = null;
  
  const progressHandler = createProgressHandler((progress) => {
    uploadProgress.value = progress;
  });

  try {
    progressHandler.start('Starting upload...');
    
    let result: UploadResult;
    
    if (selectedFile.value) {
      result = await apiClient.uploadFile(selectedFile.value);
    } else {
      result = await apiClient.uploadFileByPath(filePath.value);
    }

    uploadResult.value = result;

    if (result.success) {
      progressHandler.complete('Upload complete!');
    } else {
      progressHandler.error('Upload failed!');
    }
  } catch (error: any) {
    uploadResult.value = {
      success: false,
      error: error.message,
      message: `Upload error: ${error.message}`
    };
    progressHandler.error('Upload failed!');
  } finally {
    uploading.value = false;
    setTimeout(() => {
      uploadProgress.value = null;
    }, 3000);
  }
}

async function uploadFolder() {
  if (!folderPath.value) {
    return;
  }

  uploading.value = true;
  uploadResult.value = null;
  
  const progressHandler = createProgressHandler((progress) => {
    uploadProgress.value = progress;
  });

  try {
    progressHandler.start('Starting folder upload...');
    
    const result = await apiClient.uploadFolder(
      folderPath.value, 
      pattern.value, 
      workers.value
    );

    uploadResult.value = result;

    if (result.success) {
      progressHandler.complete('Folder upload complete!');
    } else {
      progressHandler.error('Folder upload failed!');
    }
  } catch (error: any) {
    uploadResult.value = {
      success: false,
      error: error.message,
      message: `Upload error: ${error.message}`
    };
    progressHandler.error('Folder upload failed!');
  } finally {
    uploading.value = false;
    setTimeout(() => {
      uploadProgress.value = null;
    }, 3000);
  }
}

function onFileSelected(file: File | null) {
  if (file) {
    filePath.value = '';
  }
}

onMounted(() => {
  checkConnectorStatus();
});
</script>
