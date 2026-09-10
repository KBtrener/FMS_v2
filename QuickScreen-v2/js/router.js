window.QSRouter={
 parse(){const raw=location.hash.replace(/^#/,'')||'/clients';const [path,queryHash]=raw.split('?');const [query,hash]=String(queryHash||'').split('#');const params={};new URLSearchParams(query||'').forEach((v,k)=>params[k]=v);return{path:path||'/clients',query:params,hash:hash||''}},
 go(route){location.hash=route},
 init(render){window.addEventListener('hashchange',render);render()}
};
