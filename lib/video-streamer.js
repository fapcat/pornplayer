fs = require('fs-extra');

module.exports = function (req, res) {
    const file_path = req.query.f
    const stat = fs.statSync(file_path)
    const fileSize = stat.size
    const range = req.headers.range

    if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1]
        ? parseInt(parts[1], 10)
        : fileSize-1

    if(start >= fileSize) {
        res.status(416).send('Requested range not satisfiable\n'+start+' >= '+fileSize);
        return
    }
    
    const chunksize = (end-start)+1
    const file = fs.createReadStream(file_path, {start, end})
    const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
    }

    res.writeHead(206, head)
    file.pipe(res)
    } else {
    const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(file_path).pipe(res)
    }
}
    
  
