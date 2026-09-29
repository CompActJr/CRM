import multer from 'multer'

const storage = multer.memoryStorage()

const fileFilter = (_request, file, callback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true)
  } else {
    const error = new Error('Formato de arquivo inválido. Envie imagens JPG, PNG, WEBP ou GIF.')
    error.statusCode = 400
    callback(error, false)
  }
}

export const uploadAvatarMiddleware = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
  fileFilter,
}).single('avatar')
