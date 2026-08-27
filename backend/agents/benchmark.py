"""
Benchmark Engine — Headless Red vs Blue self-play across N generations.
Runs with no sleep delays; produces per-generation statistics for the benchmark curve.
"""
import random
from dataclasses import dataclass, field
from typing import Any

from agents.red_team import RedTeamAgent, ATTACK_STRATEGIES
from agents.blue_team import BlueTeamAgent, DEFENSE_POLICIES


@dataclass
class GenerationStats:
    generation: int
    total_attacks: int = 0
    blocks: int = 0
    block_rate: float = 0.0
    avg_impact_inr: float = 0.0
    harm_prevented_inr: float = 0.0
    total_harm_inr: float = 0.0
    top_attack: str = ""
    red_sophistication: float = 0.0
    blue_accuracy: float = 0.0


def run_benchmark(
    merchant_config: dict,
    generations: int = 20,
    rounds_per_gen: int = 10,
) -> list[dict]:
    """
    Headless simulation: runs Red vs Blue for `generations` epochs.
    Each epoch = `rounds_per_gen` attack/defense cycles.
    Returns a list of per-generation stat dicts for charting.
    """
    red_agent = RedTeamAgent(agent_id="BENCH-RED")
    blue_agent = BlueTeamAgent(agent_id="BENCH-BLU")
    results: list[GenerationStats] = []

    for gen in range(1, generations + 1):
        red_agent.generation = gen
        blue_agent.generation = gen

        stats = GenerationStats(generation=gen)
        strategy_counts: dict[str, int] = {}
        total_impact = 0.0

        for _ in range(rounds_per_gen):
            # Red team attacks
            strategy = red_agent.select_strategy(merchant_config)
            attack = red_agent.compute_impact(strategy, gen)
            impact = attack["impact_inr"]
            total_impact += impact
            strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1

            # Blue team defends
            policy = DEFENSE_POLICIES.get(strategy, DEFENSE_POLICIES["price_manipulation"])
            effectiveness = min(policy["effectiveness"] + (gen - 1) * 0.02, 0.99)
            blocked = random.random() < effectiveness

            stats.total_attacks += 1
            if blocked:
                stats.blocks += 1
                stats.harm_prevented_inr += impact * effectiveness
            else:
                stats.total_harm_inr += impact

            # Track red success for evolution
            red_agent.strategy_history.append({
                "strategy": strategy,
                "success": not blocked,
            })

        # Evolve red every 5 sessions
        if gen % 5 == 0:
            red_agent.evolve()

        stats.block_rate = round(stats.blocks / stats.total_attacks, 4) if stats.total_attacks else 0
        stats.avg_impact_inr = round(total_impact / stats.total_attacks, 2) if stats.total_attacks else 0
        stats.harm_prevented_inr = round(stats.harm_prevented_inr, 2)
        stats.total_harm_inr = round(stats.total_harm_inr, 2)
        stats.top_attack = max(strategy_counts, key=strategy_counts.get) if strategy_counts else "unknown"
        stats.red_sophistication = round(0.3 + gen * 0.035, 3)
        stats.blue_accuracy = round(stats.block_rate, 3)

        results.append({
            "generation": stats.generation,
            "total_attacks": stats.total_attacks,
            "blocks": stats.blocks,
            "block_rate": stats.block_rate,
            "avg_impact_inr": stats.avg_impact_inr,
            "harm_prevented_inr": stats.harm_prevented_inr,
            "total_harm_inr": stats.total_harm_inr,
            "top_attack": stats.top_attack,
            "red_sophistication": stats.red_sophistication,
            "blue_accuracy": stats.blue_accuracy,
        })

    return results
