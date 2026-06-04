import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Restore MultiSelectFilter closing
old_multi = """      )}
    </div>
  );
});

// --- SCATTERPLOT COMPONENT"""

new_multi = """      )}
      </div>
    </div>
  );
});

// --- SCATTERPLOT COMPONENT"""

if old_multi in text:
    text = text.replace(old_multi, new_multi, 1)
    print("Restored MultiSelectFilter closing!")

# 2. Add missing </div> in ScatterChart
old_scatter = """      )}
    </div>
  );
});

// --- SLIDER CAPTCHA COMPONENT"""

new_scatter = """      )}
      </div>
    </div>
  );
});

// --- SLIDER CAPTCHA COMPONENT"""

if old_scatter in text:
    text = text.replace(old_scatter, new_scatter, 1)
    print("Fixed ScatterChart closing!")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
