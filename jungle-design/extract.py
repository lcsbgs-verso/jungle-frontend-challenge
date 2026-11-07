from pathlib import Path
import re,json,shutil,xml.etree.ElementTree as E,urllib.request,concurrent.futures,hashlib,subprocess
base=Path('/workspace/jungle-design'); src=Path('/cursor/stores/user/grok-bot/agents/99d79ec0-3e10-44e1-a0d2-3fe0df10e73f/assets')
contexts=['019e3ce89d0b7af672b8e03753dce4194c775b7fef9fc39b68d66ea0566862e2','a44b5c4301009dd9aae43d23723c3cd5594934a9b437be3a8b3f2e121e1980c9','c9bd69052b236dd752bdccf3e8e6f73dbe573a79a03658336cddfe2178a6afb4','2dc0fd76c1ee4134f2984ec7a2d78d035753c6ed3729f3ba1a9cbd600ad7aa2e','31be4d9918f11fa40203f34116f8dfafe7e7668f8b08057da8f30086b434bd05','77d2e136762d9cccffb8d877ed3dda28a92741faafefeeaeb3ee15c65aca1ff8','4bde9852fea64facd1d3b0250565dc5a877cf152c146f0ab71b7edd9912a6ab2','2c830db3790c40b60c9311330588d3af911870be8ad1d837f454163c047e68b4','d4042c1d26e2697ea69004cdcad934ff7e30634867468d51fe66701f3f3fe201','4f7fe00d43bfcd5b3ce50ad988e3635d081426aca898c05a133084cf06e41e8f','384747bef868d2163205f737727d702653801601660f681dce6824b4d6a8ec04','9d3e22a03166adf3d9ab0a0bed6823fd4fb5d5baf82a1a5847bbe628596efe25','e265883b07d148b750d4fad77b0ce74d35cacc7ad58f02dbcaf1579031d50293','85ae9d9dd3ff879027dd871925cae44813a8b344d0d80db7b99748b096febd8c','394340344fa5cdda8f2803532250c1227c7425949fd41b52a8f02cfb63f6dbf0']
shots=['e3ce255759ec12a31821bbce3cb273ab47288fed041151022d40120c5f7fcbae','b8b80bb5b8688381aefa1f9725c719b588088fdc17dce108827cb3468e5fadb4','c06bc4a7d5ffbdc3259c753d524eb22aa21e72205cae7dff58b265f596f2969a','52aa87a5cacc68fb81cff56c02188b66c636be3419eb234ae5b3f2c0222ab069','b508d1ffdacdc99f9d7dfdf43c903890f0446785d9adf68049bf7e1971336ffa','d2f2eb161975b765b3348ce65e9f067864c1d99adf63c8361f6e14e20cf95566','c7eb1c762f61978a6aaf90603c31857eb758988eec5b7c115d18ecc63efa743b']
exports=['9da198bcc0a6043bf5e6293dce45567cda97cb063707a68656f761896423f6b9','67efb5485c900c378d38bf1c88c6a125a8765d67459bdc6ce45a70ef3dbcc05c','9d93d4959bb0869f0a15f2f7fa23b639ea7f0cc5c222fdb809fffc072a2ddada','b55c06abac2dd84f3003f0483736e501b0a623b94bb0b430cdc65d26c41a8f4d','38112fd5b9c3ee39eceb867c4971a19a554b62d5dc1b17634d07d0a4a59f7591','ae875fd2255e6eceaf7ae828eda09b5fe62e04714c8d22f36fde0c055972dfb9','970449647eb49cf00d90c0295eb7ed2f2ebbe5a8f5d996825bef6e865f58c8c2','1bf25c121f1c8644355cfaa2b4f6b4a0fd5b1346cc6d47cff12947695846049e']
for d in ['contexts','screenshots','assets','exports']: (base/d).mkdir(exist_ok=True)
xml=(base/'metadata.xml').read_text(); root=E.fromstring(xml[:xml.rindex('</canvas>')+9]); frames=[]; downloads={}; assets=[]
for i,(node,h) in enumerate(zip(root,contexts)):
 key=node.attrib['id'].replace(':','-'); text=(src/(h+'.txt')).read_text(); ctx=base/'contexts'/f'{key}.txt';ctx.write_text(text)
 shot=base/'screenshots'/f'{key}.png'
 if i<7: shutil.copyfile(src/(shots[i]+'.png'),shot)
 else:
  raw=(src/(exports[i-7]+'.txt')).read_text();obj=json.loads(raw[raw.index('{'):raw.rindex('}')+1]);(base/'exports'/f'{key}.json').write_text(json.dumps(obj,indent=2));downloads[obj['export']['url']]=shot
 f={**node.attrib,'context':str(ctx),'screenshot':str(shot),'screenshot_resolution':'scaled tool preview' if i<7 else 'default node export','layers':[{'type':n.tag,**n.attrib} for n in node.iter()]}
 f['color_variables']=sorted(set(re.findall(r'var\(--color\\?/([^,]+),(#[0-9a-fA-F]+)\)',text)))
 f['font_specs']=sorted(set(re.findall(r"font-\[family-name:([^\]]+)\]",text)))
 f['sizes_px']=sorted(set(re.findall(r'text-\[([\d.]+px)\]',text)))
 f['spacing_classes']=sorted(set(re.findall(r'(?:gap|p|px|py|pt|pb|pl|pr)-\[[^\]]+\]',text)))
 for var,url in re.findall(r'const\s+(\w+)\s*=\s*"(https://www.figma.com/api/mcp/asset/[^\"]+)"',text):
  ext=url.rsplit('.',1)[-1];path=base/'assets'/url.rsplit('/',1)[-1];downloads[url]=path
  assets.append({'node':node.attrib['id'],'variable':var,'url':url,'path':str(path)})
 frames.append(f)
def dl(item):
 url,path=item
 try:
  data=subprocess.check_output(["curl","-L","--fail","--silent","--show-error",url],timeout=60)
  if not data: raise ValueError("Empty download")
  path.write_bytes(data);return {'url':url,'path':str(path),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 except Exception as e:return {'url':url,'path':str(path),'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:results=list(ex.map(dl,downloads.items()))
(base/'reference.json').write_text(json.dumps({'fileKey':'CeU18pBkD6qZT9nJvCm4qn','sessionId':'0efcc233-9a3c-4d7c-baa7-14271924fdca','frames':frames,'asset_usage':assets,'downloads':results},indent=2,ensure_ascii=False))
print('frames',len(frames),'assets usages',len(assets),'downloads',len(results),'failed',[r for r in results if 'error'in r])
