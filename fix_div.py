import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the missing </div> in ScatterChart
old_close = """      )}
    </div>
  );
});"""

new_close = """      )}
      </div>
    </div>
  );
});"""

if old_close in text:
    text = text.replace(old_close, new_close, 1)
    print("Fixed unbalanced JSX in ScatterChart!")
else:
    print("Could not find the target to replace.")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
