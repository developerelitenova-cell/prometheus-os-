import os
import re
import json

keys = set()
for root, dirs, files in os.walk('c:/Users/smayo/PROMETHEUS OS/frontend/src'):
    for file in files:
        if file.endswith('.vue') or file.endswith('.js'):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                # matches $t('something') or $t("something")
                matches = re.findall(r"\$t\(['\"](.*?)['\"]\)", content)
                for m in matches:
                    keys.add(m)
                
                # Also look for i18n-t keypath="something"
                matches_t = re.findall(r"keypath=['\"](.*?)['\"]", content)
                for m in matches_t:
                    keys.add(m)

result = {}
for k in keys:
    parts = k.split('.')
    current = result
    for i, p in enumerate(parts):
        if i == len(parts) - 1:
            current[p] = k # keep key as placeholder
        else:
            if p not in current:
                current[p] = {}
            current = current[p]

print(json.dumps(result, indent=2))
