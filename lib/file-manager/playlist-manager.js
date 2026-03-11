let config = require("../config-manager");
const {log} = require("../log-manager");
const confm = require("../config-manager");
const store = require("../store-manager");
const path = require("path");
const fs = require('fs');
const cm = require("./cache-manager");
const API_URL = 'http://10.30.1.177:8008/api/v1/playlists';

config = confm.get();

function comp_arrays(array1, array2) {
    return (
        array1.length === array2.length &&
        array1.sort().every(function (value, index) {
            return value === array2.sort()[index];
        })
    );
}

module.exports.saveFileToPlaylist = function (playlist, file) {
    let currentFiles = [];

    if (!fs.existsSync(`./${playlist}.json`)) {
        log("Playlist not found");
    } else {
        currentFiles = JSON.parse(fs.readFileSync(`./${playlist}.json`)).files;
    }

    if (currentFiles.indexOf(file) === -1) {
        currentFiles.push(file);
    }

    return new Promise((resolve, reject) => {
        let data = JSON.stringify(
            {files: currentFiles},
            null,
            2
        );
        fs.writeFileSync(
            path.resolve(path.dirname(require.main.filename) + `/${playlist}.json`),
            data
        );
    });
};

module.exports.getPlaylists = function () {
    const directoryPath = '.'; // Replace with your directory path
    let filesWithFilesKey = [];
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
                return;
            }


            files.forEach((file) => {
                const filePath = path.join(directoryPath, file);


                if (fs.statSync(filePath).isFile() && path.extname(file) === '.json') { //&& file !== 'config.json' && file !== 'config_2022.json' && file !== 'config_2023.json'


                    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    if (content.files) {
                        filesWithFilesKey.push(file);
                    }
                }
            });


            resolve(filesWithFilesKey);
        });


    });


};

module.exports.getPlaylist = function (name) {

    console.log(name);

    return new Promise((resolve, reject) => {
        store.set("files", JSON.parse(fs.readFileSync(`./${name}`)).files);
        resolve(JSON.parse(fs.readFileSync(`./${name}`)).files);
    });


};

module.exports.getRemotePlaylists = function () {
    return new Promise((resolve, reject) => {
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(playlists => {
                resolve(playlists);
            })
            .catch(err => {
                console.error('Error fetching playlists:', err);
                reject(err);
            });
    });
};


module.exports.getRemotePlaylist = function (id) {
    return new Promise((resolve, reject) => {
        fetch(`${API_URL}/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // files is an array of { id, hash, path }
                files = data.map(item => item.path.replace("/extmedia/", "/mnt/"));
                store.set("files", files);
                resolve(files);
            })
            .catch(err => {
                console.error(`Error fetching playlist ${id}:`, err);
                reject(err);
            });
    });
};