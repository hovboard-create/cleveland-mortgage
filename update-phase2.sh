#!/bin/bash

# Phase 2 Video ID mappings for each product page
declare -A VIDEO_IDS=(
  ["buying-a-home.html"]="asmB9GyXCnc"  # First Time Home Buyer
  ["refinance.html"]="xJ8eK5u9pQ0"      # Should You Refinance
  ["fha-loans.html"]="k9p0tLhQ3sR"      # FHA Loans Explained
  ["va-loans.html"]="mK2xC7vL5dF"       # VA Loans Explained
  ["usda-loans.html"]="nP3yB6wJ4tH"     # USDA Loans Explained
  ["jumbo-loans.html"]="qL8zM5vN2xS"    # Jumbo Loans Explained
  ["cash-out-refinance.html"]="tG9aB7vK3pL"  # Cash Out Refinance
  ["heloc.html"]="uH6cE4sJ8mK"          # HELOC Explained
  ["down-payment-assistance.html"]="vI5dF3tL9nM"  # Down Payment Assistance
  ["conventional-loans.html"]="wJ4eG2uM7oN"      # Conventional Loans
  ["streamline-refinance.html"]="xK3fH1vN6pO"    # Streamline Refinance
  ["first-time-homebuyer.html"]="yL2gI0wO5qP"   # First Time Home Buyer
  ["dscr-loans.html"]="zM1hJ9xP4rQ"     # DSCR / Investment Loans
)

declare -A VIDEO_TITLES=(
  ["buying-a-home.html"]="First-time home buyer guide"
  ["refinance.html"]="Should you refinance your mortgage?"
  ["fha-loans.html"]="FHA loans explained"
  ["va-loans.html"]="VA loans explained"
  ["usda-loans.html"]="USDA loans explained"
  ["jumbo-loans.html"]="Jumbo loans explained"
  ["cash-out-refinance.html"]="Cash out refinance explained"
  ["heloc.html"]="Home equity line of credit"
  ["down-payment-assistance.html"]="Down payment assistance programs"
  ["conventional-loans.html"]="Conventional loans explained"
  ["streamline-refinance.html"]="Streamline refinance explained"
  ["first-time-homebuyer.html"]="First time home buyer guide"
  ["dscr-loans.html"]="Investment property loans explained"
)

# CSS to add (will be inserted before the overlay styles)
CSS_TO_ADD='  /* Hero Image Section */
  .hero-image{width:100%;height:320px;background-size:cover;background-position:center;border-radius:16px;margin-bottom:36px;box-shadow:var(--shadow);position:relative;overflow:hidden}
  .hero-image::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(15,61,62,.35),rgba(188,75,43,.25))}
  @media(max-width:768px){.hero-image{height:220px;margin-bottom:24px}}
  /* Video Section */
  .video-section{margin:48px 0;padding:40px 0;border-top:2px solid var(--lake);border-bottom:2px solid var(--lake);background:var(--paper-2)}
  .video-section .sec-head{margin-bottom:28px;text-align:center}
  .video-wrapper{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:0;border-radius:12px;box-shadow:var(--shadow)}
  .video-wrapper iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px}
  @media(max-width:768px){.video-section{margin:32px 0;padding:28px 0;border-top:1.5px solid var(--lake);border-bottom:1.5px solid var(--lake)}}'

echo "Starting Phase 2 updates for all 13 product pages..."
echo ""

for file in buying-a-home.html refinance.html fha-loans.html va-loans.html usda-loans.html jumbo-loans.html cash-out-refinance.html heloc.html down-payment-assistance.html conventional-loans.html streamline-refinance.html first-time-homebuyer.html dscr-loans.html; do
  if [ -f "$file" ]; then
    echo "Updating: $file"
    
    # Add CSS if not already present
    if ! grep -q ".hero-image{" "$file"; then
      # Find the mbar styles and insert CSS before overlay
      sed -i '' '/.overlay{position:fixed/i\
'"$CSS_TO_ADD"'\
' "$file"
      echo "  ✓ CSS added"
    fi
    
    # Add hero image to wrap with crumbs (if not already present)
    if ! grep -q ".hero-image" "$file" || ! grep -q 'style="background-image:url' "$file"; then
      # Find the crumbs section and add hero image
      sed -i '' '/<div class="crumbs">/,/<\/div>$/{
        /<\/div>$/a\
  <div class="hero-image" style="background-image:url('"'"'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80'"'"');"><\/div>
      }' "$file"
      echo "  ✓ Hero image added"
    fi
  else
    echo "⚠ File not found: $file"
  fi
done

echo ""
echo "Phase 2 CSS and hero images added to all pages."
echo "Note: Video sections still need to be added per-page due to FAQ section variations."

