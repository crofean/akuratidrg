#!/usr/bin/env python3
# Script to write the fixed App.jsx
content = r"""
""".lstrip()

# We'll build content in chunks
parts = []

parts.append("""import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadCloud, Folder, FileText, CheckCircle, Trash2, AlertCircle, X, BarChart3, PieChart, Activity, Layers, Search, Table2, GitMerge, FileCode, CheckSquare, AlertTriangle, Stethoscope, User, ActivitySquare, Download, TrendingUp, TrendingDown, ChevronRight, Zap, Award } from 'lucide-react';
""")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    for p in parts:
        f.write(p)
print("Written", sum(len(p) for p in parts), "chars")
