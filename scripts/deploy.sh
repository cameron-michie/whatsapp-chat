#!/bin/bash

set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration from environment variables
S3_BUCKET="${DEPLOY_S3_BUCKET:-whatsapp-chat-conchspire}"
AMPLIFY_APP_ID="${DEPLOY_AMPLIFY_APP_ID}"
AMPLIFY_BRANCH="${DEPLOY_AMPLIFY_BRANCH:-main}"
AWS_PROFILE="${DEPLOY_AWS_PROFILE:-default}"
AWS_REGION="${DEPLOY_AWS_REGION:-us-east-1}"

# Validate required environment variables
if [ -z "$AMPLIFY_APP_ID" ]; then
    echo "Error: DEPLOY_AMPLIFY_APP_ID environment variable is required"
    exit 1
fi

echo "Building and deploying..."

# Build
npm run build

# Sync to S3 (deletes old files, uploads new ones)
aws s3 sync dist/ "s3://$S3_BUCKET/" --delete --profile "$AWS_PROFILE"

# Trigger Amplify deployment from S3 bucket
aws amplify start-deployment --app-id "$AMPLIFY_APP_ID" --branch-name "$AMPLIFY_BRANCH" --source-url "s3://$S3_BUCKET" --source-url-type BUCKET_PREFIX --profile "$AWS_PROFILE" --region "$AWS_REGION"
echo "Amplify deployment triggered"

echo "Deployment complete"
