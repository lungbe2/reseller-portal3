#!/bin/bash

echo "🚀 Adding all missing shadcn/ui components..."

# List of missing components
components=(
  "card"
  "badge"
  "alert-dialog"
  "input"
  "select"
  "table"
  "toast"
)

# Add each component
for component in "${components[@]}"; do
  echo "📦 Adding $component..."
  npx shadcn@latest add $component --yes --legacy-peer-deps
done

echo ""
echo "✅ All components added!"
echo "🚀 Restart your dev server: npm run dev"
