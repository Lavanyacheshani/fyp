import React, { useState } from 'react';
import { ChevronDown, Mail, MessageCircle, Phone, ExternalLink, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DashboardLayout from '../components/DashboardLayout';

interface FAQItem {
  question: string;
  answer: string;
}

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const faqs: FAQItem[] = [
    {
      question: 'How do I track my container?',
      answer: 'You can track your container by navigating to the Containers page and clicking on the specific container. This will show you real-time location, temperature, and other vital statistics.'
    },
    {
      question: 'What do the different container statuses mean?',
      answer: 'Container statuses include: Active (currently in use), Inactive (available for use), and Warning (requires attention due to unusual readings or conditions).'
    },
    {
      question: 'How do I create a new order?',
      answer: 'To create a new order, go to the Orders page and click the "New Order" button. Follow the step-by-step process to select containers and input shipping details.'
    },
    {
      question: 'What should I do if my container shows a warning status?',
      answer: 'If you see a warning status, immediately check the container details for specific alerts. Contact our support team if the issue requires immediate attention.'
    },
    {
      question: 'How is the eco-rating calculated?',
      answer: 'The eco-rating is calculated based on several factors including energy efficiency, route optimization, and sustainable practices throughout the shipping process.'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in p-6">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">Help Center</h1>
          <p className="mt-1 text-secondary-500">
            Find answers to common questions or contact our support team
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <div className="mb-6">
                <h2 className="text-lg font-medium text-secondary-900">
                  Frequently Asked Questions
                </h2>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="text"
                    className="pl-10 pr-3 py-2 w-full rounded-md border border-secondary-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Search FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-secondary-200 rounded-lg overflow-hidden"
                  >
                    <button
                      className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-secondary-50"
                      onClick={() => toggleQuestion(index)}
                    >
                      <span className="font-medium text-secondary-900">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 text-secondary-500 transition-transform ${
                          expandedQuestions.includes(index) ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedQuestions.includes(index) && (
                      <div className="px-4 py-3 bg-secondary-50 border-t border-secondary-200">
                        <p className="text-secondary-700">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-medium text-secondary-900 mb-4">
                Need More Help?
              </h2>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={<Phone className="h-4 w-4" />}
                >
                  +1 (555) 123-4567
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={<Mail className="h-4 w-4" />}
                >
                  support@greenlink.com
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  icon={<MessageCircle className="h-4 w-4" />}
                >
                  Live Chat
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-medium text-secondary-900 mb-4">
                Resources
              </h2>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  User Guide
                </a>
                <a
                  href="#"
                  className="flex items-center text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  API Documentation
                </a>
                <a
                  href="#"
                  className="flex items-center text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Release Notes
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Help;
