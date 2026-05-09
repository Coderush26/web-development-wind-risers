pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        FRONTEND_DIR = 'client'
        BACKEND_DIR  = 'server'
        PM2_APP_NAME = 'wind-risers-backend'
        NGINX_ROOT   = '/var/www/html'
    }

    stages {
        stage('Clone') {
            steps {
                echo 'Cloning repository...'
                checkout scm
            }
        }

        stage('Install & Build Frontend') {
            steps {
                dir('client') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Install Backend') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Deploy Frontend to Nginx') {
            steps {
                sh 'sudo cp -r client/build/* /var/www/html/'
            }
        }

        stage('Deploy Backend with PM2') {
            steps {
                dir('server') {
                    sh '''
                        pm2 describe wind-risers-backend > /dev/null 2>&1 \
                        && pm2 restart wind-risers-backend \
                        || pm2 start server.js --name wind-risers-backend
                        pm2 save
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ wind-risers deployed successfully!'
        }
        failure {
            echo '❌ Build failed — check console output above.'
        }
    }
}
