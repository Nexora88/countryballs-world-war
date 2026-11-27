/**
 * Victory Conditions
 * Multiple paths to win — not just painting the map.
 */

export class VictorySystem {
  constructor(world) {
    this.world = world;
    this.winner = null;
    this.victoryType = null;
  }

  check() {
    if (this.winner) return this.winner;

    const player = this.world.getPlayer();
    if (!player) return null;

    // 1. Military Domination — control most power or many wars won
    const totalPower = this.world.getAllCountries().reduce((s, c) => s + c.power, 0);
    if (player.power > totalPower * 0.38) {
      this.winner = player;
      this.victoryType = 'military';
      return player;
    }

    // 2. Economic Hegemony
    const totalEcon = this.world.getAllCountries().reduce((s, c) => s + c.economy, 0);
    if (player.economy > totalEcon * 0.32 && player.gold > 800) {
      this.winner = player;
      this.victoryType = 'economic';
      return player;
    }

    // 3. Diplomatic Unity — large alliance bloc
    if (player.allies.size >= 6) {
      this.winner = player;
      this.victoryType = 'diplomatic';
      return player;
    }

    // 4. Technological Singularity
    if (player.tech >= 11) {
      const othersMax = Math.max(...this.world.getAllCountries().filter(c => !c.isPlayer).map(c => c.tech));
      if (player.tech >= othersMax + 3) {
        this.winner = player;
        this.victoryType = 'tech';
        return player;
      }
    }

    // 5. Nuclear Monopoly
    const nuclearCount = this.world.getAllCountries().filter(c => c.nuclear).length;
    if (player.nuclear && nuclearCount === 1 && this.world.year >= 2028) {
      this.winner = player;
      this.victoryType = 'nuclear';
      return player;
    }

    // Defeat: player collapsed
    if (player.stability < 12 || player.military < 8) {
      this.winner = null;
      this.victoryType = 'defeat';
      return 'defeat';
    }

    return null;
  }

  getMessage() {
    const map = {
      military: 'Askeri Hakimiyet — Dünyanın en güçlü ordusuna sahipsin.',
      economic: 'Ekonomik Hegemonya — Küresel ekonominin merkezi oldun.',
      diplomatic: 'Diplomatik Birlik — Geniş bir ittifak ağı kurdun.',
      tech: 'Teknolojik Tekel — Rakiplerini teknolojiyle geride bıraktın.',
      nuclear: 'Nükleer Tekel — Tek nükleer güç olarak kaldın.',
      defeat: 'Yenilgi — Ülken çöktü veya ağır hasar aldı.'
    };
    return map[this.victoryType] || '';
  }
}