# Playzik (server side)
## Temporary fix
In `node_module/ytdl-core/lib/sig.js` at **line 63**.
```js
if (ndx >= 0) {
  const end = body.indexOf('.join("")};', ndx)
  const subBody = body.slice(ndx, end)

  const functionBody = `${subBody}.join("")};${functionName}(ncode);`
  functions.push(functionBody)
}
```
