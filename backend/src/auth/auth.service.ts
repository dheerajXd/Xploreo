import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(dto: RegisterDto) {
    const existing = await this.authRepository.findByUsername(dto.username);
    if (existing) throw new ConflictException('Username already exists');

    const existingEmail = await this.authRepository.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('Email already exists');

    const user = await this.authRepository.create({
      userId: dto.username,
      username: dto.username,
      password: dto.password,
      role: dto.role,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      location: dto.location,
      status: 'active',
    });

    const { password: _pw, ...safe } = user;
    return { message: 'Registered successfully', user: safe };
  }

  async login(dto: LoginDto) {
    const rawUsername = dto.username?.trim();
    const user =
      this.authRepository.findByUsername(rawUsername) ??
      this.authRepository.findByEmail(rawUsername);
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const { password: _pw, ...safe } = user;
    return {
      user: safe,
      headers: {
        'x-user-id': user.userId,
        'x-user-role': toApiHeaderRole(user.role),
      },
    };
  }

  async findAll() {
    const users = await this.authRepository.findAll();
    return users.map(({ password: _pw, ...u }) => u);
  }

  async findOne(id: string) {
    const user = await this.authRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const { password: _pw, ...safe } = user;
    return safe;
  }

  async update(
    id: string,
    dto: UpdateAuthDto,
    actor?: { userId?: string; role?: string },
  ) {
    const isAdmin = actor?.role === 'superadmin';
    if (!isAdmin) {
      if (actor?.userId !== id) {
        throw new ForbiddenException('You can only update your own account.');
      }
      if (dto.role !== undefined) {
        throw new ForbiddenException('You cannot change your account type.');
      }
    }
    const updated = await this.authRepository.update(id, dto);
    if (!updated) throw new NotFoundException(`User ${id} not found`);
    const { password: _pw, ...safe } = updated;
    return safe;
  }

  async remove(id: string) {
    const deleted = await this.authRepository.delete(id);
    if (!deleted) throw new NotFoundException(`User ${id} not found`);
    return { message: `User ${id} deleted` };
  }
}

function toApiHeaderRole(role: string): string {
  if (role === 'traveller') return 'TRAVELLER';
  if (role === 'hotel') return 'PARTNER';
  return role;
}
