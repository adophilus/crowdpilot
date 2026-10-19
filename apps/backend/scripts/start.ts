import { NodeRuntime } from '@effect/platform-node'
import { Layer } from 'effect'
import { AppLive } from '@/app'

NodeRuntime.runMain(Layer.launch(AppLive))
