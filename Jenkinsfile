pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        FRONTEND_DIR = 'client'      // change to 'frontend' if needed
        BACKEND_DIR  = 'server'      // change to 'backend' if needed
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
                dir("${FRONTEND_DIR}") {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Install Backend') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Deploy Frontend to Nginx') {
            steps {
                sh "sudo cp -r ${FRONTEND_DIR}/build/* ${NGINX_ROOT}/"
            }
        }

        stage('Deploy Backend with PM2') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh """
                        pm2 describe ${PM2_APP_NAME} > /dev/null 2>&1 \
                        && pm2 restart ${PM2_APP_NAME} \
                        || pm2 start index.js --name ${PM2_APP_NAME}
                        pm2 save
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Deployment successful!'
        }
        failure {
            echo '❌ Build failed — check logs above.'
        }
    }
}
