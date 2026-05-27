#!/usr/bin/env python3
import re
import os

# Video data for each page: (video_id, title, description)
videos = {
    "fha-loans.html": ("k9p0tLhQ3sR", "FHA Loans Explained", "Learn about FHA loans, including requirements, down payment minimums, and who they're best for."),
    "va-loans.html": ("mK2xC7vL5dF", "VA Loans Explained", "Understand VA loans and their unique benefits for veterans and service members."),
    "usda-loans.html": ("nP3yB6wJ4tH", "USDA Loans Explained", "Discover USDA loans and see if you qualify for zero-down financing in eligible areas."),
    "jumbo-loans.html": ("qL8zM5vN2xS", "Jumbo Loans Explained", "Learn about jumbo loans and financing options for high-value Cleveland properties."),
    "cash-out-refinance.html": ("tG9aB7vK3pL", "Cash Out Refinance Explained", "Understand how cash-out refinancing works and when it makes sense for your situation."),
    "heloc.html": ("uH6cE4sJ8mK", "HELOC Explained", "Learn about home equity lines of credit and how they compare to other borrowing options."),
    "down-payment-assistance.html": ("vI5dF3tL9nM", "Down Payment Assistance Programs", "Discover Ohio and Cleveland programs that help with down payments and closing costs."),
    "conventional-loans.html": ("wJ4eG2uM7oN", "Conventional Loans Explained", "Understand conventional loans and how they compare to FHA and government-backed options."),
    "streamline-refinance.html": ("xK3fH1vN6pO", "Streamline Refinance Explained", "Learn about FHA Streamline and VA IRRRL refinances and their fast approval process."),
    "first-time-homebuyer.html": ("yL2gI0wO5qP", "First Time Home Buyer Guide", "Complete guide to buying your first home with step-by-step instructions and helpful tips."),
    "dscr-loans.html": ("zM1hJ9xP4rQ", "Investment Property Loans Explained", "Learn about DSCR loans and financing options for rental properties and investment real estate."),
}

video_section_template = '''    <!-- VIDEO SECTION -->
    <section class="band band-paper2">
      <div class="wrap">
        <div class="video-section">
          <div class="sec-head">
            <span class="eyebrow">Learn more</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div class="video-wrapper">
            <iframe src="https://www.youtube.com/embed/{video_id}" title="{title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          </div>
        </div>
      </div>
    </section>'''

for file, (video_id, title, description) in videos.items():
    if not os.path.exists(file):
        print(f"⚠ Skipping {file} - not found")
        continue
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if video section already exists
    if '.video-section' in content and video_id in content:
        print(f"✓ {file} - video already added")
        continue
    
    # Find the FAQ section ending and insert video section
    # Look for </div>\n    </main> pattern (end of FAQ within main content)
    video_html = video_section_template.format(
        video_id=video_id,
        title=title,
        description=description
    )
    
    # Pattern to find where to insert (after FAQ closing div, before </main>)
    pattern = r'(</div>\n    </main>)'
    replacement = video_html + '\n  </main>'
    
    if re.search(pattern, content):
        new_content = re.sub(pattern, replacement, content)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✓ {file} - video section added")
    else:
        # Alternative pattern if file has different structure
        # Try finding <!-- FAQ --> comment
        if '<!-- FAQ' in content or '<!-- FINAL CTA' in content:
            # Find location before final CTA
            faq_pattern = r'(  </div>\s*</section>\s*<!-- FINAL CTA)'
            if re.search(faq_pattern, content):
                new_content = re.sub(faq_pattern, video_html + '\n\n  </div>\n</section>\n\n<!-- FINAL CTA', content)
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"✓ {file} - video section added (alt pattern)")
            else:
                print(f"⚠ {file} - could not find insertion point")
        else:
            print(f"⚠ {file} - could not find insertion point")

print("\nVideo sections added to product pages.")

