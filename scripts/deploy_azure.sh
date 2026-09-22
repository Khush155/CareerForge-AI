#!/usr/bin/env bash
# ==============================================================================
# CareerForge AI — Azure Cloud Deployment Script
# Role: Teammate 2 (DevOps & Azure Cloud Lead)
#
# Target Environment:
# - Resource Group: rg-careerforge-ai (eastasia)
# - Container Registry: acrcareerforge532876
# - Storage Account: stcareerforge532876 (Azure Files: careerforgeshare)
# - Container Apps Environment: env-careerforge-wp
# - Storage Link: careerforgestorage -> /app/data
# - Container App: careerforge-ai-app (Port 8000, external ingress)
# ==============================================================================

set -euo pipefail

export PATH="/opt/homebrew/bin:$PATH"

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-careerforge-ai}"
LOCATION="${LOCATION:-eastasia}"
ACR_NAME="${ACR_NAME:-acrcareerforge532876}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-stcareerforge532876}"
FILE_SHARE_NAME="careerforgeshare"
ENV_NAME="${ENV_NAME:-env-careerforge-wp}"
APP_NAME="${APP_NAME:-careerforge-ai-app}"
STORAGE_LINK_NAME="careerforgestorage"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ACR_SERVER="${ACR_NAME}.azurecr.io"

echo "=================================================================="
echo " Deploying CareerForge AI to Azure Container Apps"
echo "=================================================================="
echo "Resource Group:    $RESOURCE_GROUP"
echo "Location:          $LOCATION"
echo "ACR Server:        $ACR_SERVER"
echo "Storage Account:   $STORAGE_ACCOUNT"
echo "Environment:       $ENV_NAME"
echo "Container App:     $APP_NAME"
echo "=================================================================="

# 1. Verify Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Error: Azure CLI ('az') is not installed or not in PATH."
    exit 1
fi

# 2. Verify Azure Authentication
if ! az account show &> /dev/null; then
    echo "❌ Error: Not logged in to Azure. Run 'az login' first."
    exit 1
fi

SUBSCRIPTION_NAME=$(az account show --query "name" -o tsv)
SUBSCRIPTION_ID=$(az account show --query "id" -o tsv)
echo "✅ Logged in to Azure: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"

# 3. Retrieve ACR Credentials
echo "🔑 Fetching ACR credentials..."
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

# 4. Generate YAML Specification for Container App with Volume Mount
echo "📝 Generating Container App definition with /app/data persistent volume mount..."
APP_YAML_FILE="./.careerforge_app_deploy.yaml"

cat <<EOF > "$APP_YAML_FILE"
properties:
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 8000
      allowInsecure: false
    registries:
    - server: ${ACR_SERVER}
      username: ${ACR_NAME}
      passwordSecretRef: acr-password
    secrets:
    - name: acr-password
      value: "${ACR_PASSWORD}"
  template:
    volumes:
    - name: careerforge-volume
      storageName: ${STORAGE_LINK_NAME}
      storageType: AzureFile
    containers:
    - name: ${APP_NAME}
      image: ${ACR_SERVER}/careerforge-ai:${IMAGE_TAG}
      resources:
        cpu: 0.5
        memory: 1.0Gi
      env:
      - name: MODE
        value: "mock"
      - name: DATABASE_PATH
        value: "/app/data/careerforge.db"
      - name: PORT
        value: "8000"
      volumeMounts:
      - volumeName: careerforge-volume
        mountPath: /app/data
EOF

# 5. Create or Update Azure Container App
echo "🚀 Deploying CareerForge AI Container App..."
if ! az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo "   Creating new Container App '$APP_NAME'..."
    az containerapp create \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$ENV_NAME" \
        --yaml "$APP_YAML_FILE" \
        --output table
else
    echo "   Updating existing Container App '$APP_NAME'..."
    az containerapp update \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --yaml "$APP_YAML_FILE" \
        --output table
fi

rm -f "$APP_YAML_FILE"

# 6. Verify deployment and output URL
echo "🔍 Retrieving application URL..."
FQDN=$(az containerapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

echo ""
echo "=================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=================================================================="
echo "Public Web App & API URL:  https://$FQDN"
echo "Health Check:              https://$FQDN/health"
echo "API Documentation (Docs):  https://$FQDN/docs"
echo "=================================================================="
