import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/users/entities/user.entity';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateWorkspaceDto,
  WorkspaceMemberResponseDto,
  WorkspaceResponseDto,
} from './dto/workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List workspaces available to the current user' })
  @ApiOkResponse({ type: WorkspaceResponseDto, isArray: true })
  findAll(@CurrentUser() user: User) {
    return this.workspacesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a workspace' })
  @ApiCreatedResponse({ type: WorkspaceResponseDto })
  create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: User) {
    return this.workspacesService.create(dto, user.id);
  }

  @Put(':id/active')
  @ApiOperation({ summary: 'Set the active workspace' })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  switchActive(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.switchActive(id, user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List workspace members' })
  @ApiOkResponse({ type: WorkspaceMemberResponseDto, isArray: true })
  members(@Param('id') id: string, @CurrentUser() user: User) {
    return this.workspacesService.listMembers(id, user.id);
  }
}
