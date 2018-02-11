const Hapi = require('hapi');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' })
const s3 = new AWS.S3({
    params: { Bucket: 'karan-demo' }
});

const rekognition = new AWS.Rekognition();

const server = new Hapi.Server();
server.connection({ port: 8000, host: 'localhost' });

server.register(require('inert'), (err) => {
    if (err) {
        console.log(err);
    }

    server.start((err) => {
        if (err) {
            console.log(err);
        }
        console.log(`Server running at ${server.info.uri}`);
    })

    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: 'public'
            }
        }
    })

    server.route({
        method: 'POST',
        path: '/labels',
        config: {
            payload: {
                output: 'stream',
                maxBytes: 209715200,
                parse: true,
                allow: 'multipart/form-data'
            },
            handler: (request, reply) => {

                s3.upload({
                    Key: 'demo-one.jpg',
                    Body: request.payload['one'],
                    ACL: 'public-read'
                }, (err, data) => {
                    if (err) {
                        console.log(err);
                    }
                    else
                        console.log('uploaded');

                    let params = {
                        Image: {
                            S3Object: {
                                Bucket: 'karan-demo',
                                Name: 'demo-one.jpg'
                            }
                        },
                        MaxLabels: 5,
                        MinConfidence: 70
                    };
                    rekognition.detectLabels(params, function (err, data) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log(data.Labels);
                            reply(data.Labels);
                        }
                    })

                });
            }
        },
    });

    server.route({
        method: "POST",
        path: "/faces",
        config: {
            payload: {
                output: "stream",
                maxBytes: 209715200,
                parse: true,
                allow: "multipart/form-data"
            },
            handler: (request, reply) => {
                s3.upload({
                    Key: 'demo-two.jpg',
                    Body: request.payload['two'],
                    ACL: 'public-read'
                }, (err, data) => {
                    if (err) {
                        console.log(err);
                    }
                    else
                        console.log('uploaded');

                    s3.upload({
                        Key: 'demo-three.jpg',
                        Body: request.payload['three'],
                        ACL: 'public-read'
                    }, (err, data) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            console.log('uploaded');

                            var params = {
                                SimilarityThreshold: 80,
                                SourceImage: {
                                    S3Object: {
                                        Bucket: "karan-demo",
                                        Name: "demo-two.jpg"
                                    }
                                },
                                TargetImage: {
                                    S3Object: {
                                        Bucket: "karan-demo",
                                        Name: "demo-three.jpg"
                                    }
                                }
                            };

                            rekognition.compareFaces(params, function(err, data){
                                if(err) {
                                    console.log(err);
                                }
                                else {
                                    console.log(data);
                                    reply(data);
                                }
                            })

                        }
                    })

                })
            }
        }
    });

    server.route({
        method: "POST",
        path: "/celebs",
        config: {
            payload: {
                output: "stream",
                maxBytes: 209715200,
                parse: true,
                allow: "multipart/form-data"
            },
            handler: (request, reply) => {

            //  Recognizing Celebrities

            }
        }
    })
})
