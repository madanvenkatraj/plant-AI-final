import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ShieldCheck, Zap, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { currentUser } = useAuth();

  const features = [
    {
      name: 'Instant Diagnosis',
      description: 'Upload a leaf image and get results in seconds using advanced AI.',
      icon: Zap,
    },
    {
      name: 'High Accuracy',
      description: 'Trained on thousands of plant images for reliable disease detection.',
      icon: ShieldCheck,
    },
    {
      name: 'Multilingual Support',
      description: 'Get treatment advice in English, Tamil, Hindi, Telugu, and Kannada.',
      icon: Globe,
    },
    {
      name: 'Comprehensive Care',
      description: 'Receive detailed causes, symptoms, treatments, and prevention tips.',
      icon: Leaf,
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-plantGreen-50 to-white pt-16 sm:pt-24 lg:pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
            >
              <span className="block">Protect Your Plants with</span>
              <span className="block text-plantGreen-600">AI-Powered Diagnosis</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Upload a photo of a sick plant leaf and instantly receive a diagnosis, along with actionable treatment and prevention advice.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex justify-center gap-4"
            >
              <Link
                to={currentUser ? "/diagnoses" : "/register"}
                className="rounded-full bg-plantGreen-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-plantGreen-200 hover:bg-plantGreen-700 transition-all hover:scale-105"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-gray-900 shadow-md ring-1 ring-gray-200 hover:bg-gray-50 transition-all"
              >
                Learn More
              </a>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-plantGreen-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-plantGreen-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-plantGreen-600">Faster Diagnosis</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to care for your plants
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div 
                  key={feature.name} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow"
                >
                  <dt className="flex flex-col items-center gap-y-4 text-base font-semibold leading-7 text-gray-900">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-plantGreen-100">
                      <feature.icon className="h-8 w-8 text-plantGreen-600" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
