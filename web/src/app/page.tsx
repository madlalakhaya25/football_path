import {
  Eye,
  LineChart,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RatingRing } from "@/components/ui/rating-ring";
import { StatBar } from "@/components/ui/stat-bar";

const ROLES = [
  {
    Icon: Target,
    title: "Player",
    description:
      "Build your digital passport, track attributes, and get seen by scouts.",
  },
  {
    Icon: Users,
    title: "Coach",
    description:
      "Manage your squad, log match results, and rate performances in seconds.",
  },
  {
    Icon: Eye,
    title: "Scout",
    description:
      "Discover talent across academies with rich, verified player profiles.",
  },
];

const FEATURES = [
  { Icon: ShieldCheck, title: "Digital passports", text: "A verified profile that travels with every player." },
  { Icon: Star, title: "Coach ratings", text: "Star ratings and notes saved after every match." },
  { Icon: LineChart, title: "Progress tracking", text: "Attribute trends that show real development over time." },
  { Icon: Trophy, title: "Match centre", text: "Fixtures, results, and squad appearances in one place." },
];

const ATTRIBUTES = [
  { label: "Pace", value: 82 },
  { label: "Shooting", value: 75 },
  { label: "Passing", value: 76 },
  { label: "Dribbling", value: 80 },
  { label: "Defending", value: 64 },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            <a className="text-sm text-muted-foreground hover:text-foreground" href="#roles">Roles</a>
            <a className="text-sm text-muted-foreground hover:text-foreground" href="#features">Features</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button variant="primary" size="sm" asChild>
              <Link href="/auth/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <Badge variant="brand" className="mb-4">
              #WeBuildChampions
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Football development{" "}
              <span className="text-primary">starts here.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
              Build the next generation of footballers through structured
              training, performance ratings, and digital player passports.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/auth/register">Create your passport</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">Watch demo</a>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                ["18", "Players"],
                ["3", "Coaches"],
                ["12", "Matches"],
              ].map(([n, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-bold tabular-nums">{n}</dt>
                  <dd className="text-sm text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Passport preview — showcases signature components */}
          <Card className="mx-auto w-full max-w-sm overflow-hidden">
            <div className="h-1 bg-brand" />
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Daniel Mbatha</CardTitle>
                <CardDescription>Right Winger · U17 Squad</CardDescription>
              </div>
              <RatingRing value={78} size={84} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="brand">Winger</Badge>
                <Badge variant="neutral">Age 16</Badge>
                <Badge variant="neutral">Right foot</Badge>
              </div>
              <div className="space-y-2.5 pt-1">
                {ATTRIBUTES.map((a) => (
                  <StatBar key={a.label} label={a.label} value={a.value} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Roles ──────────────────────────────────────────── */}
        <section
          id="roles"
          className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6"
        >
          <h2 className="text-2xl font-bold tracking-tight">
            One platform, every role
          </h2>
          <p className="mt-2 text-muted-foreground">
            Choose how you want to grow.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map(({ Icon, title, description }) => (
              <Link key={title} href="/auth/login">
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <span className="mb-2 grid size-11 place-items-center rounded-lg bg-brand/15 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────── */}
        <section
          id="features"
          className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            To develop, empower, and create opportunities for grassroots
            footballers.
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Growfit FA
          </p>
        </div>
      </footer>
    </div>
  );
}
