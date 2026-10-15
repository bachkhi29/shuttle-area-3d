"""Bundle the same local runtime into one offline HTML; no minifier/network."""
from pathlib import Path
import argparse
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('output',type=Path);args=p.parse_args()
s=(root/'index.html').read_text()
s=s.replace('<link rel="stylesheet" href="styles.css">','<style>\n'+(root/'styles.css').read_text()+'\n</style>')
for f in ['vendor/three.min.js','src/rules.js','src/main.js']:
 content=(root/f).read_text().replace('</script','<\\/script')
 s=s.replace(f'<script src="{f}"></script>','<script>\n'+content+'\n</script>')
args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(s)
print(args.output)
