import prisma from '../config/prisma'
import bcrypt from 'bcrypt'

const register = async (email: string, password: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })
  if (existingUser) {
    throw new Error('User already exists')
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })
  return user
}


export default {
  register,
}