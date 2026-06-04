#!/bin/bash

# Function to add BreadcrumbList schema for product pages
add_breadcrumb_product() {
  local file=$1
  local title=$2
  
  if ! grep -q "BreadcrumbList" "$file"; then
    local schema=$(cat <<EOF
<!-- Schema: BreadcrumbList -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://cleveland-mortgage.com"},
    {"@type": "ListItem", "position": 2, "name": "$title", "item": "https://cleveland-mortgage.com/$file"}
  ]
}
</script>
EOF
)
    sed -i '' "/<\/head>/i\\
$schema
" "$file"
    echo "Added BreadcrumbList to $file"
  fi
}

# Function to add BreadcrumbList schema for landlord pages
add_breadcrumb_landlord() {
  local file=$1
  local title=$2
  
  if ! grep -q "BreadcrumbList" "$file"; then
    local schema=$(cat <<EOF
<!-- Schema: BreadcrumbList -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://cleveland-mortgage.com"},
    {"@type": "ListItem", "position": 2, "name": "Landlord Resources", "item": "https://cleveland-mortgage.com/landlord/guide.html"},
    {"@type": "ListItem", "position": 3, "name": "$title", "item": "https://cleveland-mortgage.com/$file"}
  ]
}
</script>
EOF
)
    sed -i '' "/<\/head>/i\\
$schema
" "$file"
    echo "Added BreadcrumbList to $file"
  fi
}

# Add to product pages
add_breadcrumb_product "buying-a-home.html" "Buying a Home"
add_breadcrumb_product "cash-out-refinance.html" "Cash-Out Refinance"
add_breadcrumb_product "conventional-loans.html" "Conventional Loans"
add_breadcrumb_product "dscr-loans.html" "DSCR Loans"
add_breadcrumb_product "down-payment-assistance.html" "Down Payment Assistance"
add_breadcrumb_product "fha-loans.html" "FHA Loans"
add_breadcrumb_product "first-time-homebuyer.html" "First-Time Homebuyer"
add_breadcrumb_product "heloc.html" "HELOC"
add_breadcrumb_product "jumbo-loans.html" "Jumbo Loans"
add_breadcrumb_product "refinance.html" "Refinance"
add_breadcrumb_product "streamline-refinance.html" "Streamline Refinance"
add_breadcrumb_product "usda-loans.html" "USDA Loans"
add_breadcrumb_product "va-loans.html" "VA Loans"

# Add to blog pages
add_breadcrumb_product "blog-fha-vs-conventional.html" "FHA vs Conventional"
add_breadcrumb_product "blog-refinance-timing.html" "Refinance Timing"
add_breadcrumb_product "blog-dscr-rentals.html" "DSCR Rentals"

# Add to landlord pages
add_breadcrumb_landlord "landlord/guide.html" "Landlord Resources Guide"
add_breadcrumb_landlord "landlord/eviction-process.html" "Eviction Process"
add_breadcrumb_landlord "landlord/section8-eviction.html" "Section 8 Eviction"
add_breadcrumb_landlord "landlord/inspection-process.html" "Inspection Process"
add_breadcrumb_landlord "landlord/section8-rentals.html" "Section 8 Rentals"
add_breadcrumb_landlord "landlord/cmha-rentals.html" "CMHA Rentals"
add_breadcrumb_landlord "landlord/market-rents.html" "Market Rents"

