import { Injectable, NotFoundException } from '@nestjs/common';
//import { CreateUserDto } from './dto/create-user.dto';
//import { UpdateUserDto } from './dto/update-user.dto';
import { User as UserProps } from '@common/hms-lib';
import { CreateUserDto, PaginationDto, UpdateUserDto, Users } from '@common/hms-lib';
import { Observable, Subject } from 'rxjs';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  //static user data for demo purpose only
  // private readonly users:User[] = [];

  constructor(@InjectRepository(User)
  private readonly userRepository: Repository<User>) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // const user:User = { //these should be from entity
    //   ...createUserDto,
    //   id: randomUUID(),
    //   primaryEmailAddress: createUserDto.primaryEmailAddress,
    //   firstName: createUserDto.firstName,
    //   lastName: createUserDto.lastName,
    //   backupEmailAddress: '',
    //   phone: {},
    //   isPrimaryEmailAddressVerified: false,
    //   isBackupEmailAddressVerified: false,
    //   passwordHash: randomUUID()
    // }

    const user = await this.findOneUserByPrimaryEmailAddress(createUserDto.primaryEmailAddress);

    if (user) {
      throw new Error('User already exists');
    }

    const newUser = this.userRepository.create(createUserDto);
    const theUser = await this.userRepository.save(newUser);

    const userProps: UserProps = {
      ...theUser,
      passwordHash: "",
      isBackupEmailAddressVerified: false,
      isPrimaryEmailAddressVerified: false,
      id: '',
      backupEmailAddress: '',
      phone: {}
    }

    return userProps
  }


  async findAll(): Promise<Users> {
    const users = await this.userRepository.find();

    const userProps: UserProps[] = users.map((user) => ({
      ...user,

      phone: {},
      isPrimaryEmailAddressVerified: false,
      isBackupEmailAddressVerified: false,
      backupEmailAddress: '',
    }));

    return { users: userProps };
  }

  async findOne(id: string): Promise<UserProps> {
    // return this.users.find((user) => user.id === id);
    const user = await this.userRepository.findOneBy({ id });

    const userProps: UserProps = {
      ...user,

      phone: {},
      isPrimaryEmailAddressVerified: false,
      isBackupEmailAddressVerified: false,
    };

    return userProps;
  }


  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.findOne(id);

    if (!existingUser) {
      throw new Error(`User not found by id ${ id }`);
    }

    // if (userIndex !== -1){
    //   this.users[userIndex] = {
    //     ...this.users[userIndex],
    //     ...updateUserDto
    //   }
    //   return this.users[userIndex]
    // }

    Object.assign(existingUser, updateUserDto);
    const newUser = await this.userRepository.save(existingUser);

    const userProps: UserProps = {
      ...newUser,
      phone: {},
      isPrimaryEmailAddressVerified: false,
      isBackupEmailAddressVerified: false,
    };

    return userProps;

  }



  async remove(id: string): Promise<UserProps> {

    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User not found by id ${ id }`);
    }
    const removedUser = await this.userRepository.remove(user);

    const userProps: UserProps = {
      ...removedUser,
      phone: {},
      isPrimaryEmailAddressVerified: false,
      isBackupEmailAddressVerified: false,
    };

    return userProps;
  }

  queryUsers(
    paginationDtoStream: Observable<PaginationDto>,
  ): Observable<Users> {
    const subject = new Subject<Users>();
    const onNext = async (paginationDto: PaginationDto) => {
      const start = paginationDto.page * paginationDto.skip;
      subject.next({
        // users: this.users.slice(start, start + paginationDto.skip),
        users: (await this.findAll()).users.slice(start, start + paginationDto.skip)
      });
    };

    const onComplete = () => subject.complete();

    paginationDtoStream.subscribe({
      next: onNext,
      complete: onComplete,
    });

    return subject.asObservable();
  }

  async findOneUserByPrimaryEmailAddress(
    primaryEmailAddress: string,
  ): Promise<UserProps> {
    const user = await this.userRepository.findOneBy({ primaryEmailAddress });

    const userProps: UserProps = {
      ...user,
      phone: {},
      isPrimaryEmailAddressVerified: false,
      isBackupEmailAddressVerified: false,
    };

    return userProps;
  }
}