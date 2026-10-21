"""Zip dist/ (contents at archive root) for Netlify drag-and-drop."""
import shutil, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
print(shutil.make_archive(os.path.join(root, '..', 'stock-desk-deploy-v5'), 'zip', os.path.join(root, 'dist')))
