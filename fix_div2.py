import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the extra </div> in MultiSelectFilter
old_multi = """      )}
      </div>
    </div>
  );
});

// --- SCATTERPLOT COMPONENT"""

new_multi = """      )}
    </div>
  );
});

// --- SCATTERPLOT COMPONENT"""

if old_multi in text:
    text = text.replace(old_multi, new_multi, 1)
    print("Fixed extra </div> in MultiSelectFilter!")
else:
    print("Could not find the target to replace for MultiSelectFilter.")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
