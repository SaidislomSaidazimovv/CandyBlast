const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const entries=['index.html','manifest.json','sw.js','css','js','images','vendor'];
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const entry of entries){const from=path.join(root,entry),to=path.join(out,entry);fs.cpSync(from,to,{recursive:true,filter:source=>!source.endsWith('.map')&&!/[\\/]images[\\/]candies[\\/][1-4]\.png$/i.test(source)});}
console.log('Candy Blast mobile web assets built in dist/');
