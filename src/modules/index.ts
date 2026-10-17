/** Ext-модули фронтенда. Одна строка на модуль — при мерже только добавлять. */
import { registerModules } from './ext-core/registry'
import { guaranteesModule } from './ext-guarantees'
import { wageModule } from './ext-wage'
import { hrConsoleModule } from './ext-hr'
import { academyModule } from './academy'
import { ladderModule } from './ext-ladder'
import { policiesModule } from './ext-policies'
import { aiJanaModule } from './ai-jana'
import { grievanceModule } from './ext-grievance'
import { kbGapsModule } from './ext-kb-gaps'
import { shiftsModule } from './ext-shifts'
import './ext-shifts/i18n'
import './ext-kb-gaps/i18n'
import { demoModule } from './ext-demo'
import { peopleModule } from './ext-people'
import './ext-people/i18n'
import './ext-grievance/i18n'
import './ext-policies/i18n'
import './ext-wage/i18n'
import './ext-hr/i18n'
import './academy/i18n'

registerModules([
  wageModule,
  guaranteesModule,
  hrConsoleModule,
  academyModule,
  ladderModule,
  policiesModule,
  aiJanaModule,
  grievanceModule,
  kbGapsModule,
  shiftsModule,
  demoModule,
  peopleModule,
])

export { extElement, extNavigation, extPlannedScreens } from './ext-core/registry'
export { ExtSlot } from './ext-core/ExtSlot'
export { RejectReason } from './ext-guarantees/RejectReason'
export { useRejectReasonRequired, MIN_REJECT_COMMENT } from './ext-guarantees/rejectRules'
