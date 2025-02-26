import { CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"

const features = [
  {
    title: "Create an Effective Marketing Funnel",
    description: "We'll teach you how to define your target audience, set your services and pricing, and create a compelling offer. This helps you attract the right clients who are eager to book your services."
  },
  {
    title: "Set Up Simple Facebook Ads",
    description: "Learn how to set up and optimize Facebook ads, even if you're new to paid marketing. This brings clients directly to you, solving the problem of not knowing where to find them."
  },
  {
    title: "Use AI Marketing Tools (Optional)",
    description: "We'll introduce you to easy-to-use AI tools that make creating ads and marketing materials a breeze. No more feeling overwhelmed by marketing—you'll have technology working for you."
  },
  {
    title: "Nurture Leads and Build Relationships",
    description: "Discover how to respond to message requests, use templates and FAQs, and book free consultations. This turns interested people into paying clients."
  },
  {
    title: "Convert Consultations into Bookings",
    description: "We'll show you how to effectively convert consultations into bookings, upsell your services, and take deposits. This increases your income and ensures clients commit to appointments."
  }
]

export function FeaturesSection() {
  return (
    <section className="w-full bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h4 className="text-xl font-bold text-gray-900">
            <span className="font-bold">HERE'S HOW YOU CAN <u>START</u> EARNING</span>
          </h4>
          <h2 className="mt-4 text-4xl font-bold text-gray-900 md:text-5xl">
            €5k a MONTH, next week!
          </h2>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col p-6">
              <div className="mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Consultation Blueprint Callout */}
        <div className="mx-auto mt-16 max-w-3xl">
          <Card className="bg-purple-50 p-6 text-center">
            <p className="text-lg text-gray-800">
              ** We also have a separate <span className="font-bold underline">Consultation Success Blueprint</span>{" "}
              available as an add-on for just €33 which will show you EXACTLY how we run our consultations 
              to book 9 out of 10 of our consultations.**
            </p>
          </Card>
        </div>

        {/* Additional Text */}
        <div className="mx-auto mt-16 max-w-3xl space-y-6 text-center text-lg text-gray-700">
          <p>
            We've used this exact system to transform our own business, and we know it works.
          </p>
          <p>
            We've made it simple and easy to follow, so you can start seeing results quickly 
            without wasting time figuring it out on your own.
          </p>
        </div>
      </div>
    </section>
  )
} 