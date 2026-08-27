import os
import re

directory = r'c:\Users\Dell\New folder (5)\merchant-adversarial-shadow\frontend\src'
for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Replace garbled texts specifically found in the screenshots
            content = content.replace('ðŸ’a', '')
            content = content.replace('ðŸ’', '')
            content = content.replace('ðŸ›¡ï', '')
            content = content.replace('â‚¹', '₹')
            content = content.replace('ðŸŽ¯', '')
            content = content.replace('ðŸ§¬', '')
            content = content.replace('âš', '')
            content = content.replace('ðŸš€', '')
            content = content.replace('ðŸ¤–', '')
            content = content.replace('??', '')
            content = content.replace('???', '')
            content = content.replace('', '')
            
            # More general replacements for any corrupted multi-byte chars
            content = re.sub(r'ðŸ[^\s]*', '', content)
            content = re.sub(r'â[^\s]*', '', content)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
print("Done fixing garbled text")
