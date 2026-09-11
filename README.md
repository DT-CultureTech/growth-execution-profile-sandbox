# Growth Execution Profile — UI sandbox

The real rendering component for a Growth Execution Profile, with **dummy data**, so the UI can be worked on without touching production or seeing any real company.

## What is here 

```
src/components/growth-execution/   the production component, copied unchanged
sample/profile.json                a fictional company, Northwind Appliances
static-preview/index.html          open this in a browser, no install needed
```

`src/components/growth-execution/` is the live UI. Anything changed there is a change to the real thing and can be ported straight back, so keep the file names and the exports as they are.

## Two ways in

**Just look at it.** Open `static-preview/index.html` in a browser. It is the built page with its stylesheet beside it. Good for reading the layout and editing CSS quickly; it will not re-render when you change the component.

**Work on it properly.**

```
npm install
npm run dev      # then open http://localhost:3000
```

Edits to the component or to `growth-execution.module.css` appear immediately.

## The four files that matter

| File | What it is |
|---|---|
| `GrowthExecutionRenderer.tsx` | The component. Takes one prop, `profile`. 931 lines |
| `growth-execution.module.css` | All the styling. 1,274 lines. **Most UI work belongs here** |
| `growth-execution-contract.ts` | The TypeScript shape of a profile. Do not change without asking |
| `growth-execution-fonts.ts` | Font setup |

The palette comes from the product theme and is deliberate: `#0033ff` blue, `#000` black, `#e5e5e5` hairline. Blue never decorates — it appears only where something is a lever, a state, or a live control.

## The shape of a profile

```
{ kind: "growth-execution-v1",
  profile: {
    company, intro { partOne, partTwo }, pmf { elements },
    innovation { elements }, market { model, levers },
    growthExecution { opportunities, highVelocityTests },
    researchRecord { company, exemplars }, annexure } }
```

Six levers, `v1` `v2` `v3` `m1` `m2` `m3`. The v levers move volume, the m levers move margin.

## Rules

**The data here is invented.** Northwind Appliances does not exist, the figures are made up and the sources point at `example.com`. Do not replace it with a real company — this repo is public.

**Do not add network calls, keys or environment variables.** The component is pure presentation and must stay that way.

**Empty is a real state.** Several sections are legitimately blank when evidence does not exist, and the UI has to read well when they are. `innovation` in the sample is deliberately empty for exactly this reason. Do not design as though every field is always filled.
