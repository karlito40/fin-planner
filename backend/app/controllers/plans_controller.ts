import type { HttpContext } from '@adonisjs/core/http'
import Plan from '#models/plan'

export default class PlansController {
  async store({ request, response }: HttpContext) {
    const { title, timeHorizon, initialCapital, monthlyDca, expectedAnnualReturn, allocations } =
      request.only([
        'title',
        'timeHorizon',
        'riskLevel',
        'initialCapital',
        'monthlyDca',
        'expectedAnnualReturn',
        'allocations',
      ])

    const plan = await Plan.create({
      title,
      timeHorizon,
      initialCapital,
      monthlyDca,
      expectedAnnualReturn,
      allocations,
    })

    return response.created({
      message: 'Plan generated and saved successfully',
      data: plan,
    })
  }
}
