import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/services/authService";

export async function GET(request) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [periods, receivedEvaluations] = await Promise.all([
      prisma.evaluationPeriod.findMany({
        orderBy: [{ quartal: "asc" }, { createdAt: "desc" }],
        select: { id: true, name: true, quartal: true, isActive: true },
      }),
      prisma.evaluation.findMany({
        where: {
          evaluateeId: user.id,
          submittedAt: { not: null },
        },
        select: {
          id: true,
          periodId: true,
          evaluator: { select: { name: true } },
          period: {
            select: { id: true, name: true, quartal: true, isActive: true },
          },
          scores: {
            select: {
              score: true,
              notes: true,
              kpi: {
                select: {
                  id: true,
                  indicatorName: true,
                  type: true,
                  maxScore: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const chartGroups = new Map();
    const feedbackNotes = [];

    for (const evaluation of receivedEvaluations) {
      if (!evaluation.period) continue;

      for (const score of evaluation.scores) {
        const groupKey = `${evaluation.period.quartal}:${score.kpi.type}`;
        const group = chartGroups.get(groupKey) || {
          quartal: evaluation.period.quartal,
          type: score.kpi.type,
          indicators: new Map(),
        };
        const indicator = group.indicators.get(score.kpi.id) || {
          id: score.kpi.id,
          label: score.kpi.indicatorName,
          total: 0,
          count: 0,
          maxScore: score.kpi.maxScore || 5,
        };

        indicator.total += score.score;
        indicator.count += 1;
        group.indicators.set(score.kpi.id, indicator);
        chartGroups.set(groupKey, group);

        if (evaluation.periodId !== 1 && score.notes?.trim()) {
          feedbackNotes.push({
            evaluationId: evaluation.id,
            evaluatorName: evaluation.evaluator.name,
            quartal: evaluation.period.quartal,
            source: "Appraisal",
            indicators: score.kpi.indicatorName,
            score: score.score,
            maxScore: score.kpi.maxScore || 5,
            notes: score.notes.trim(),
          });
        }
      }
    }

    const performanceByQuarter = [...chartGroups.values()].map((group) => ({
      quartal: group.quartal,
      type: group.type,
      indicators: [...group.indicators.values()].map((indicator) => ({
        id: indicator.id,
        label: indicator.label,
        score: indicator.total / indicator.count,
        maxScore: indicator.maxScore,
      })),
    }));

    const quarterByNumber = new Map();
    for (const period of periods) {
      const current = quarterByNumber.get(period.quartal);
      if (!current || period.isActive) {
        quarterByNumber.set(period.quartal, {
          id: period.id,
          name: period.name,
          quartal: period.quartal,
          isOpen: Boolean(period.isActive),
        });
      }
    }

    const activePeriod = periods.find((period) => period.isActive) || null;

    return NextResponse.json({
      message: "Success",
      data: {
        activePeriod,
        quarterOptions: [...quarterByNumber.values()],
        performanceByQuarter,
        feedbackNotes,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
