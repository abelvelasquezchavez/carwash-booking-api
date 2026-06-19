import { userRepository } from '../repositories/user.repository';
import { comparePassword, hashPassword } from '../utils/bcrypt';
import { signToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError } from '../utils/AppError';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';

export interface AuthResult {
  token: string;
  user: { id: number; email: string };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const password = await hashPassword(input.password);
    const user = await userRepository.create({ email: input.email, password });

    return {
      token: signToken({ sub: user.id, email: user.email }),
      user: { id: user.id, email: user.email },
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await comparePassword(input.password, user.password);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return {
      token: signToken({ sub: user.id, email: user.email }),
      user: { id: user.id, email: user.email },
    };
  },
};
