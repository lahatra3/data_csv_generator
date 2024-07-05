import { availableParallelism } from "node:os";
import cluster from "node:cluster";
import process from "node:process";
import { createWriteStream, stat } from "node:fs";
import { randomUUID, randomInt } from "node:crypto";


const DATA_SINK = process.env["DATA_SINK"];
const DATA_SINK_SIZE = parseInt(process.env["DATA_SINK_SIZE"]) || 1024;
const numCPUs = availableParallelism();
let successfulExits = 0;


const data_writer = (filename) => {
    const writer = createWriteStream(filename, { 
        flags: "a", 
        encoding: "utf-8", 
        autoClose: true,
        highWaterMark: 1024 * 1024 * 731 
    });

    writer.on('finish', () => {
        console.log("Writing finished...");
    });

    writer.on('error', (err) => {
        console.log("Error: ", err);
        process.exit(1);
    });

    const data1 = randomUUID().split("-").join(",");
    const data2 = randomUUID().split("-").reverse().join(",");
    const data3 = randomUUID().split("-").join(",");
    const data4 = randomInt(1331);
    const data5 = Date.now();

    writer.write(`${new Date(data5).toISOString()},${data3},${data2},${data1},${data4}\n`);
}

const fileWatcher = (filename, maxSize) => {
    stat(filename, (err, stats) => {
        if (err) {
            console.error("Error: ", err);
            process.exit(1);
        }

        if (stats.size > maxSize) {
            console.log("Completed...");
            process.exit(0);
        }
    })
}

if (cluster.isPrimary) {
    console.log(`Primary PID: ${process.pid} is running ...`);
    
    for (let index = 0; index < numCPUs; index++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker with PID: ${worker.process.pid} is died with status code ${code} and signal ${signal} ...`);
        
        if (code === 0) {
            successfulExits++;
            if (successfulExits === numCPUs) {
                console.log('All workers have completed their tasks. Exiting primary process ...');
                process.exit(0);
            }
        } else {
            console.log("Restarting new worker...");
            cluster.fork();
        }
    });
    setInterval(() => {
        fileWatcher(DATA_SINK, DATA_SINK_SIZE);
    }, 1131);
} else {
    console.log(`Worker PID: ${process.pid} is started ...`);
    setInterval(() => {
        data_writer(DATA_SINK);
    }, 731);
}
