import UserTaskCustomConfig from './components/UserTaskCustomConfig.vue'
import BoundaryEventTimer from './components/BoundaryEventTimer.vue'

export const CustomConfigMap = {
  UserTask: {
    name: 'User Task',
    componet: UserTaskCustomConfig
  },
  BoundaryEventTimerEventDefinition: {
    name: '定Hour边界Event(非中断)',
    componet: BoundaryEventTimer
  }
}
