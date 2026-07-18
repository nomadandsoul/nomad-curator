#!/bin/bash
# Nomad & Soul - Upload CLI Commands
# Generated: 2026-07-18
# Purpose: Upload blueprints to GitHub and Google Drive

echo "=========================================="
echo "Nomad & Soul - Cloud Upload Commands"
echo "=========================================="
echo ""

# ============================================
# PART 1: GIT PUSH TO GITHUB
# ============================================

echo "█ PART 1: GIT PUSH TO GITHUB"
echo "----------------------------------------"
echo ""
echo "Step 1: Initialize or navigate to your repository"
echo ""
echo "  cd /Users/ludodebruyn/Desktop/Skills"
echo ""

echo "Step 2: Add all blueprint files to staging"
echo ""
echo "  git add klaviyo-trigger-blueprint.json"
echo "  git add klaviyo-flow-architecture.json"
echo "  git add roadmap-execution-plan.json"
echo "  git add VALIDATION-REPORT.md"
echo ""

echo "Step 3: Commit with descriptive message"
echo ""
echo "  git commit -m \"feat: Nomad & Soul Klaviyo v3 integration blueprints - Started Checkout, Browse Abandonment, Post-Purchase, Loyalty, and Reactivation flows with Shopify Markets support\""
echo ""

echo "Step 4: Push to remote repository"
echo ""
echo "  git push origin main"
echo ""
echo "  (Or replace 'main' with your branch name if different)"
echo ""

echo "Verification:"
echo "  git log --oneline -n 1"
echo "  git status"
echo ""

# ============================================
# PART 2: GOOGLE DRIVE UPLOAD
# ============================================

echo "█ PART 2: GOOGLE DRIVE UPLOAD"
echo "----------------------------------------"
echo ""

echo "OPTION A: Using Google Drive Web UI (Manual)"
echo ""
echo "  1. Go to: https://drive.google.com"
echo "  2. Navigate to folder: 1i_awMZ_HpDCRWUQmEPi1xZCNgmLVz84k"
echo "  3. Create new folder: 'Nomad-Soul-Blueprints'"
echo "  4. Upload files:"
echo "     - klaviyo-trigger-blueprint.json"
echo "     - klaviyo-flow-architecture.json"
echo "     - roadmap-execution-plan.json"
echo "     - VALIDATION-REPORT.md"
echo "  5. Share folder ID: 1Y3kwSFlsmYp5qluYc-ZdmTt2-l5euIH9"
echo ""

echo "OPTION B: Using gdrive CLI (Recommended for automation)"
echo ""
echo "Step 1: Install gdrive if not already installed"
echo ""
echo "  brew install gdrive"
echo ""

echo "Step 2: Authenticate gdrive (first time only)"
echo ""
echo "  gdrive about"
echo ""
echo "  (This will open a browser window for OAuth authentication)"
echo ""

echo "Step 3: Create target directory structure"
echo ""
echo "  gdrive mkdir -p \"1i_awMZ_HpDCRWUQmEPi1xZCNgmLVz84k\" \"Nomad-Soul-Blueprints\""
echo ""

echo "Step 4: Upload all blueprint files"
echo ""
echo "  # Set the parent folder ID (replace with the folder ID from step 3)"
echo "  PARENT_FOLDER_ID=\"1i_awMZ_HpDCRWUQmEPi1xZCNgmLVz84k\""
echo ""
echo "  gdrive upload --parent \$PARENT_FOLDER_ID /Users/ludodebruyn/Desktop/Skills/klaviyo-trigger-blueprint.json"
echo "  gdrive upload --parent \$PARENT_FOLDER_ID /Users/ludodebruyn/Desktop/Skills/klaviyo-flow-architecture.json"
echo "  gdrive upload --parent \$PARENT_FOLDER_ID /Users/ludodebruyn/Desktop/Skills/roadmap-execution-plan.json"
echo "  gdrive upload --parent \$PARENT_FOLDER_ID /Users/ludodebruyn/Desktop/Skills/VALIDATION-REPORT.md"
echo ""

echo "Step 5: Verify uploads"
echo ""
echo "  gdrive list --parent \$PARENT_FOLDER_ID"
echo ""

echo "Step 6: Share folder with second Drive location (optional)"
echo ""
echo "  # If you need to copy files to: 1Y3kwSFlsmYp5qluYc-ZdmTt2-l5euIH9"
echo "  # Use Drive UI: Right-click folder > Share > Add 1Y3kwSFlsmYp5qluYc-ZdmTt2-l5euIH9"
echo ""

# ============================================
# PART 3: AUTOMATION SCRIPT
# ============================================

echo "█ PART 3: COMBINED AUTOMATION SCRIPT"
echo "----------------------------------------"
echo ""
echo "Run this complete script to execute all uploads at once:"
echo ""
cat > /tmp/nomad-upload.sh << 'SCRIPT_END'
#!/bin/bash

echo "🚀 Starting Nomad & Soul Cloud Upload..."
echo ""

# Variables
SOURCE_DIR="/Users/ludodebruyn/Desktop/Skills"
GITHUB_BRANCH="main"
GDRIVE_PARENT="1i_awMZ_HpDCRWUQmEPi1xZCNgmLVz84k"

# Step 1: Git Push
echo "📦 Step 1: Pushing to GitHub..."
cd "$SOURCE_DIR"
git add klaviyo-trigger-blueprint.json klaviyo-flow-architecture.json roadmap-execution-plan.json VALIDATION-REPORT.md
git commit -m "feat: Nomad & Soul Klaviyo v3 integration - Complete blueprint suite with Browse Abandonment + Shopify Markets"
git push origin $GITHUB_BRANCH
if [ $? -eq 0 ]; then
  echo "✅ GitHub push successful"
else
  echo "❌ GitHub push failed - check credentials and try again"
  exit 1
fi

echo ""

# Step 2: Google Drive Upload
echo "☁️  Step 2: Uploading to Google Drive..."

# Check if gdrive is installed
if ! command -v gdrive &> /dev/null; then
  echo "⚠️  gdrive not found. Installing..."
  brew install gdrive
fi

# Upload files
echo "Uploading: klaviyo-trigger-blueprint.json"
gdrive upload --parent "$GDRIVE_PARENT" "$SOURCE_DIR/klaviyo-trigger-blueprint.json" > /dev/null 2>&1

echo "Uploading: klaviyo-flow-architecture.json"
gdrive upload --parent "$GDRIVE_PARENT" "$SOURCE_DIR/klaviyo-flow-architecture.json" > /dev/null 2>&1

echo "Uploading: roadmap-execution-plan.json"
gdrive upload --parent "$GDRIVE_PARENT" "$SOURCE_DIR/roadmap-execution-plan.json" > /dev/null 2>&1

echo "Uploading: VALIDATION-REPORT.md"
gdrive upload --parent "$GDRIVE_PARENT" "$SOURCE_DIR/VALIDATION-REPORT.md" > /dev/null 2>&1

echo "✅ Google Drive upload complete"
echo ""

# Verification
echo "📋 Verification:"
echo "Google Drive folder contents:"
gdrive list --parent "$GDRIVE_PARENT"

echo ""
echo "✅ ALL UPLOADS COMPLETE"
echo ""
echo "Files are now available at:"
echo "  - GitHub: Your repository"
echo "  - Google Drive: Folder ID $GDRIVE_PARENT"

SCRIPT_END

echo "Save the script:"
echo "  cat > ~/nomad-upload.sh << 'EOF'"
echo "  [paste content above]"
echo "  EOF"
echo ""

echo "Make it executable:"
echo "  chmod +x ~/nomad-upload.sh"
echo ""

echo "Run the complete upload:"
echo "  ~/nomad-upload.sh"
echo ""

# ============================================
# VERIFICATION COMMANDS
# ============================================

echo "█ VERIFICATION COMMANDS"
echo "----------------------------------------"
echo ""

echo "Verify Git Status:"
echo "  cd /Users/ludodebruyn/Desktop/Skills && git status"
echo ""

echo "Verify GitHub Upload:"
echo "  git log --oneline -n 5"
echo ""

echo "Verify Google Drive Upload:"
echo "  gdrive list --parent 1i_awMZ_HpDCRWUQmEPi1xZCNgmLVz84k"
echo ""

echo "Test Klaviyo v3 API Compatibility (requires curl + API key):"
echo "  curl -X POST https://a.klaviyo.com/api/v3/events \\"
echo "    -H 'Authorization: Bearer YOUR_KLAVIYO_API_KEY' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Revision: 2024-07-15' \\"
echo "    -d @/Users/ludodebruyn/Desktop/Skills/klaviyo-trigger-blueprint.json"
echo ""

echo "=========================================="
echo "END OF UPLOAD INSTRUCTIONS"
echo "=========================================="
