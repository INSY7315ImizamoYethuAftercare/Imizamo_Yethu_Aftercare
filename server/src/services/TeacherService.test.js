import { jest } from '@jest/globals'
import bcrypt from 'bcryptjs'
import { TeacherService } from './TeacherService.js'

describe('TeacherService', () => {
  let deps
  let service

  beforeEach(() => {
    deps = {
      teacherRepository: { create: jest.fn(), update: jest.fn(), findAll: jest.fn(), setActive: jest.fn() },
      managerRepository: { findByUserId: jest.fn() },
      userRepository: { findByEmail: jest.fn(), createUser: jest.fn() },
    }
    service = new TeacherService(deps)
  })

  it('blocks a non-manager from creating a teacher account', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue(null)
    await expect(
      service.createTeacher({ userId: 1, email: 'a@b.org', password: 'longenough', fullName: 'T' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rejects a password shorter than 8 characters', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.userRepository.findByEmail.mockResolvedValue(null)
    await expect(
      service.createTeacher({ userId: 1, email: 'a@b.org', password: 'short', fullName: 'T' }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('rejects an email that is already registered', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.userRepository.findByEmail.mockResolvedValue({ user_id: 1 })
    await expect(
      service.createTeacher({ userId: 1, email: 'a@b.org', password: 'longenough', fullName: 'T' }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('creates a teacher account with a hashed password', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.userRepository.findByEmail.mockResolvedValue(null)
    deps.userRepository.createUser.mockResolvedValue({ user_id: 9 })
    deps.teacherRepository.create.mockResolvedValue({ teacher_id: 7, user_id: 9 })

    const result = await service.createTeacher({
      userId: 1, email: 'teacher2@iylh.org', password: 'longenough', fullName: 'New Teacher', contactEmail: 'teacher2@iylh.org',
    })

    expect(result.teacher_id).toBe(7)
    const [[createUserArgs]] = deps.userRepository.createUser.mock.calls
    const stored = createUserArgs.passwordHash
    expect(await bcrypt.compare('longenough', stored)).toBe(true)
  })

  it('makes a new teacher choose their own password at first sign-in', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.userRepository.findByEmail.mockResolvedValue(null)
    deps.userRepository.createUser.mockResolvedValue({ user_id: 9 })
    deps.teacherRepository.create.mockResolvedValue({ teacher_id: 7, user_id: 9 })

    await service.createTeacher({
      userId: 1, email: 'teacher2@iylh.org', password: 'longenough', fullName: 'New Teacher', contactEmail: 'teacher2@iylh.org',
    })

    expect(deps.userRepository.createUser.mock.calls[0][0].mustChangePassword).toBe(true)
  })

  it('returns 404 when deactivating a teacher that does not exist', async () => {
    deps.managerRepository.findByUserId.mockResolvedValue({ manager_id: 2 })
    deps.teacherRepository.setActive.mockResolvedValue(null)
    await expect(
      service.setTeacherActive({ userId: 1, teacherId: 999, isActive: false }),
    ).rejects.toMatchObject({ status: 404 })
  })
})