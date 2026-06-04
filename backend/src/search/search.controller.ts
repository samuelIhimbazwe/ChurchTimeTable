import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  search(@CurrentUser() user: JwtPayload, @Query() query: SearchQueryDto) {
    return this.searchService.search(user.sub, query.q);
  }

  @Get('suggestions')
  suggestions(@CurrentUser() user: JwtPayload, @Query() query: SearchQueryDto) {
    return this.searchService.suggestions(user.sub, query.q);
  }
}
