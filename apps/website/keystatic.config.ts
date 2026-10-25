import { collection, config, fields, singleton } from "@keystatic/core"

// Where edits are saved (NEXT_PUBLIC_KEYSTATIC_STORAGE):
// - "local" (default): straight to the files in this folder. For development.
// - "cloud": editors sign in with Keystatic Cloud (just an email); saves are
//   committed to GitHub, which triggers a Vercel redeploy. Best for clients.
// - "github": editors sign in with a GitHub account that can write to the repo.
// The deployed site needs "cloud" or "github" because its filesystem is read-only.
// NEXT_PUBLIC_ because the editor UI runs in the browser.
const REPO = (process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO ?? "gidoo5331/ship-link") as `${string}/${string}`

const storage = (() => {
  switch (process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE) {
    // the website lives in a monorepo folder, so remote saves go under it
    case "cloud":
      return { kind: "cloud", pathPrefix: "apps/website" } as const
    case "github":
      return { kind: "github", repo: REPO, pathPrefix: "apps/website" } as const
    default:
      return { kind: "local" } as const
  }
})()

// Keystatic Cloud project, e.g. "my-team/ship-link" (from keystatic.cloud)
const cloud = process.env.NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT
  ? { project: process.env.NEXT_PUBLIC_KEYSTATIC_CLOUD_PROJECT }
  : undefined

const images = (folder: string, label = "Photos") =>
  fields.array(
    fields.image({
      label: "Photo",
      directory: `public/images/${folder}`,
      publicPath: `/images/${folder}/`,
      validation: { isRequired: true },
    }),
    {
      label,
      description: "The first photo is the cover. JPG, PNG or WebP.",
      // stored as images/0.jpg etc.; show just the file name
      itemLabel: (props) => props.value?.filename.split("/").pop() ?? "Photo",
    },
  )

const features = fields.array(fields.text({ label: "Feature" }), {
  label: "Features",
  description: "Short highlights, e.g. “Reverse camera”",
  itemLabel: (props) => props.value || "Feature",
})

export default config({
  storage,
  ...(cloud && { cloud }),
  ui: {
    brand: { name: "Website content" },
    navigation: {
      Company: ["company"],
      Catalog: ["cars", "products", "categories"],
    },
  },

  singletons: {
    company: singleton({
      label: "Company details",
      path: "content/company",
      format: { data: "json" },
      schema: {
        name: fields.text({ label: "Company name", validation: { isRequired: true } }),
        logo: fields.image({
          label: "Logo",
          description: "Square works best. Leave empty to show your initials.",
          directory: "public/images/company",
          publicPath: "/images/company/",
        }),
        tagline: fields.text({ label: "Tagline", description: "One line shown in the footer" }),
        heroHeading: fields.text({ label: "Home page heading" }),
        heroSubheading: fields.text({ label: "Home page intro", multiline: true }),
        about: fields.text({ label: "About the company", multiline: true }),
        phone: fields.text({ label: "Phone", description: "As people should dial it, e.g. +233 24 000 0000" }),
        whatsapp: fields.text({
          label: "WhatsApp number",
          description: "Digits only, with country code, e.g. 233240000000",
          validation: { pattern: { regex: /^\d{8,15}$|^$/, message: "Digits only, with the country code" } },
        }),
        email: fields.text({ label: "Email" }),
        address: fields.text({ label: "Address" }),
      },
    }),
  },

  collections: {
    cars: collection({
      label: "Cars",
      slugField: "title",
      path: "content/cars/*",
      format: { data: "json" },
      columns: ["price", "available"],
      schema: {
        title: fields.slug({
          name: { label: "Listing name", description: "e.g. 2021 Toyota Camry — also sets the web address" },
        }),
        available: fields.checkbox({
          label: "Available",
          description: "Untick when sold — it disappears from the site",
          defaultValue: true,
        }),
        make: fields.text({ label: "Make", validation: { isRequired: true } }),
        model: fields.text({ label: "Model", validation: { isRequired: true } }),
        // text, not integer: the number field would show 2021 as "2,021"
        year: fields.text({
          label: "Year",
          validation: { isRequired: true, pattern: { regex: /^(19|20)\d{2}$/, message: "A 4-digit year, e.g. 2021" } },
        }),
        price: fields.integer({ label: "Price (USD)", description: "Shown with a cedi estimate", validation: { isRequired: true, min: 0 } }),
        mileage: fields.integer({ label: "Mileage (km)", validation: { isRequired: true, min: 0 } }),
        engineSize: fields.text({ label: "Engine", description: "e.g. 2.5L" }),
        transmission: fields.select({
          label: "Transmission",
          options: [
            { label: "Automatic", value: "Automatic" },
            { label: "Manual", value: "Manual" },
          ],
          defaultValue: "Automatic",
        }),
        color: fields.text({ label: "Colour" }),
        condition: fields.select({
          label: "Condition",
          options: [
            { label: "Foreign Used", value: "Foreign Used" },
            { label: "Locally Used", value: "Locally Used" },
            { label: "Brand New", value: "Brand New" },
          ],
          defaultValue: "Foreign Used",
        }),
        description: fields.text({ label: "Description", multiline: true }),
        images: images("cars"),
        features,
      },
    }),

    products: collection({
      label: "Products",
      slugField: "name",
      path: "content/products/*",
      format: { data: "json" },
      columns: ["category", "price", "available"],
      schema: {
        name: fields.slug({ name: { label: "Product name", description: "Also sets the web address" } }),
        available: fields.checkbox({
          label: "Available",
          description: "Untick when sold out — it disappears from the site",
          defaultValue: true,
        }),
        category: fields.relationship({
          label: "Category",
          collection: "categories",
          validation: { isRequired: true },
        }),
        price: fields.integer({ label: "Price (USD)", description: "Shown with a cedi estimate", validation: { isRequired: true, min: 0 } }),
        description: fields.text({ label: "Description", multiline: true }),
        images: images("products"),
        specs: fields.array(
          fields.object({
            label: fields.text({ label: "Name", description: "e.g. Power output" }),
            value: fields.text({ label: "Value", description: "e.g. 5 KVA" }),
          }),
          {
            label: "Specifications",
            itemLabel: (props) => `${props.fields.label.value || "Spec"}: ${props.fields.value.value}`,
          },
        ),
        features,
      },
    }),

    categories: collection({
      label: "Product categories",
      slugField: "name",
      path: "content/categories/*",
      format: { data: "json" },
      schema: {
        name: fields.slug({ name: { label: "Category name", description: "e.g. Generators" } }),
        sortOrder: fields.integer({
          label: "Order",
          description: "Lower numbers show first on the Products page",
          defaultValue: 0,
        }),
      },
    }),
  },
})
