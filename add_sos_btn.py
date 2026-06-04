with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_btn = '            <Printer size={14} /> Cetak Handout PDF\n          </button>\n\n        </div>\n      </div>'
new_btn = ('            <Printer size={14} /> Cetak Handout PDF\n'
           '          </button>\n'
           '          <button\n'
           '            onClick={exportSosialisasiPPT}\n'
           '            disabled={isExportingSosPPT}\n'
           '            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"\n'
           '            title="Export ke PowerPoint"\n'
           '          >\n'
           '            <Download size={14} /> {isExportingSosPPT ? \'Mengekspor...\' : \'Export PPTX\'}\n'
           '          </button>\n'
           '\n'
           '        </div>\n'
           '      </div>')

if old_btn in text:
    text = text.replace(old_btn, new_btn, 1)
    print('Button added to Sosialisasi!')
else:
    # Try without the double newline
    old_btn2 = '            <Printer size={14} /> Cetak Handout PDF\n          </button>\n        </div>\n      </div>'
    if old_btn2 in text:
        new_btn2 = ('            <Printer size={14} /> Cetak Handout PDF\n'
                    '          </button>\n'
                    '          <button\n'
                    '            onClick={exportSosialisasiPPT}\n'
                    '            disabled={isExportingSosPPT}\n'
                    '            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"\n'
                    '            title="Export ke PowerPoint"\n'
                    '          >\n'
                    '            <Download size={14} /> {isExportingSosPPT ? \'Mengekspor...\' : \'Export PPTX\'}\n'
                    '          </button>\n'
                    '        </div>\n'
                    '      </div>')
        text = text.replace(old_btn2, new_btn2, 1)
        print('Button added (alt anchor)!')
    else:
        # find near the Printer text
        idx = text.find('Cetak Handout PDF\n          </button>')
        print(f"Found at {idx}, context:")
        print(repr(text[idx-10:idx+80]))

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
