// import { useState } from "react";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Filter, RotateCcw, Sparkles } from "lucide-react";
// import { toast } from "sonner";

// interface SegmentEditorProps {
//   onEvaluate: (conditions: string) => void;
//   isEvaluating: boolean;
// }

// const exampleConditions = `price > 50
// category = Jackets
// stock_status = instock
// stock_quantity >= 0
// on_sale = true
// title = Assumenda.
// `;

// export const SegmentEditor = ({ onEvaluate, isEvaluating }: SegmentEditorProps) => {
//   const [conditions, setConditions] = useState("");

//   const handleEvaluate = () => {
//     if (!conditions.trim()) {
//       toast.error("Please enter at least one condition");
//       return;
//     }
//     onEvaluate(conditions);
//   };

//   const handleReset = () => {
//     setConditions("");
//   };

//   const handleLoadExample = () => {
//     setConditions(exampleConditions);
//     toast.success("Example conditions loaded");
//   };

//   return (
//     <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border">
//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <div className="space-y-1">
//             <Label htmlFor="conditions" className="text-lg font-semibold flex items-center gap-2">
//               <Filter className="h-5 w-5 text-primary" />
//               Define Filter Conditions
//             </Label>
//             <p className="text-sm text-muted-foreground">
//               Enter filter rules, one per line
//             </p>
//           </div>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleLoadExample}
//             className="gap-2"
//           >
//             <Sparkles className="h-4 w-4" />
//             Load Example
//           </Button>
//         </div>

//         <Textarea
//           id="conditions"
//           placeholder={`Enter conditions (one per line):
// price > 100
// stock_status = instock
// title != Test`}
//           value={conditions}
//           onChange={(e) => setConditions(e.target.value)}
//           className="min-h-[200px] font-mono text-sm resize-none bg-background"
//         />

//         <div className="space-y-2">
//           <p className="text-xs text-muted-foreground">
//             <span className="font-semibold">Supported operators:</span> = != &gt; &lt; &gt;= &lt;=
//           </p>
//           <p className="text-xs text-muted-foreground">
//             <span className="font-semibold">Available Filters:</span> title, price, stock_status, stock_quantity, category, on_sale
//           </p>
//         </div>

//         <div className="flex gap-3">
//           <Button
//             onClick={handleEvaluate}
//             disabled={isEvaluating}
//             className="flex-1 bg-primary hover:bg-primary-hover"
//           >
//             {isEvaluating ? "Evaluating..." : "Evaluate Filter"}
//           </Button>
//           <Button
//             onClick={handleReset}
//             variant="outline"
//             disabled={isEvaluating}
//           >
//             <RotateCcw className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>
//     </Card>
//   );
// };

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Filter, RotateCcw, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface SegmentEditorProps {
  onEvaluate: (conditions: string) => void;
  isEvaluating: boolean;
}

interface ValidationError {
  line: number;
  message: string;
  text: string;
}

const exampleConditions = `price > 50
category = Jackets
stock_status = instock
stock_quantity >= 0
on_sale = true
title = Assumenda.`;

const VALID_FIELDS = ['title', 'price', 'stock_status', 'stock_quantity', 'category', 'on_sale'];
const VALID_OPERATORS = ['=', '!=', '>', '<', '>=', '<='];
const NUMERIC_FIELDS = ['price', 'stock_quantity'];
const BOOLEAN_FIELDS = ['on_sale'];
const COMPARISON_OPERATORS = ['>', '<', '>=', '<='];

export const SegmentEditor = ({ onEvaluate, isEvaluating }: SegmentEditorProps) => {
  const [conditions, setConditions] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateConditions = (text: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const lines = text.split('\n');

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) return;

      // Check for minimum structure
      const parts = trimmedLine.split(/\s+/);
      if (parts.length < 3) {
        errors.push({
          line: index + 1,
          message: "Invalid format. Expected: field operator value",
          text: trimmedLine
        });
        return;
      }

      const field = parts[0].toLowerCase().trim();
      const operator = parts[1].trim();
      const value = parts.slice(2).join(' ').trim();

      // Validate field name
      if (!VALID_FIELDS.includes(field)) {
        errors.push({
          line: index + 1,
          message: `Invalid field '${field}'. Valid fields: ${VALID_FIELDS.join(', ')}`,
          text: trimmedLine
        });
        return;
      }

      // Validate operator
      if (!VALID_OPERATORS.includes(operator)) {
        errors.push({
          line: index + 1,
          message: `Invalid operator '${operator}'. Valid operators: ${VALID_OPERATORS.join(', ')}`,
          text: trimmedLine
        });
        return;
      }

      // Validate value is not empty
      if (!value) {
        errors.push({
          line: index + 1,
          message: "Value cannot be empty",
          text: trimmedLine
        });
        return;
      }

      // Validate operator-field compatibility
      if (COMPARISON_OPERATORS.includes(operator) && !NUMERIC_FIELDS.includes(field)) {
        errors.push({
          line: index + 1,
          message: `Comparison operator '${operator}' can only be used with numeric fields (${NUMERIC_FIELDS.join(', ')})`,
          text: trimmedLine
        });
        return;
      }

      // Check if value contains operators (likely missing newline)
      if (VALID_OPERATORS.some(op => value.includes(op))) {
        errors.push({
          line: index + 1,
          message: "Value contains an operator. Did you forget a newline between conditions?",
          text: trimmedLine
        });
        return;
      }

      // Check if value starts with a valid field name (likely missing newline)
      const valueFirstWord = value.split(/\s+/)[0].toLowerCase();
      if (VALID_FIELDS.includes(valueFirstWord)) {
        errors.push({
          line: index + 1,
          message: "Value starts with a field name. Did you forget a newline between conditions?",
          text: trimmedLine
        });
        return;
      }

      // Validate numeric values
      if (NUMERIC_FIELDS.includes(field)) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push({
            line: index + 1,
            message: `Field '${field}' requires a numeric value, got '${value}'`,
            text: trimmedLine
          });
          return;
        }
        if (field === 'stock_quantity' && numValue < 0) {
          errors.push({
            line: index + 1,
            message: "stock_quantity cannot be negative",
            text: trimmedLine
          });
          return;
        }
      }

      // Validate boolean values
      if (BOOLEAN_FIELDS.includes(field)) {
        const lowerValue = value.toLowerCase();
        if (lowerValue !== 'true' && lowerValue !== 'false') {
          errors.push({
            line: index + 1,
            message: `Field '${field}' requires a boolean value (true/false), got '${value}'`,
            text: trimmedLine
          });
          return;
        }
        if (COMPARISON_OPERATORS.includes(operator)) {
          errors.push({
            line: index + 1,
            message: `Boolean field '${field}' cannot use comparison operators. Use = or != only`,
            text: trimmedLine
          });
          return;
        }
      }

      // Validate stock_status values
      if (field === 'stock_status') {
        const validStatuses = ['instock', 'outofstock', 'onbackorder'];
        const lowerValue = value.toLowerCase();
        if (!validStatuses.includes(lowerValue) && operator === '=') {
          errors.push({
            line: index + 1,
            message: `Consider using one of: ${validStatuses.join(', ')} for stock_status`,
            text: trimmedLine
          });
        }
      }
    });

    return errors;
  };

  const handleEvaluate = () => {
    if (!conditions.trim()) {
      toast.error("Please enter at least one condition");
      setValidationErrors([]);
      return;
    }

    // Validate conditions
    const errors = validateConditions(conditions);
    setValidationErrors(errors);

    if (errors.length > 0) {
      toast.error(`Found ${errors.length} validation error${errors.length > 1 ? 's' : ''}. Please fix them before evaluating.`);
      return;
    }

    // If validation passes, proceed with evaluation
    toast.success("Validation passed! Evaluating conditions...");
    onEvaluate(conditions);
  };

  const handleReset = () => {
    setConditions("");
    setValidationErrors([]);
  };

  const handleLoadExample = () => {
    setConditions(exampleConditions);
    setValidationErrors([]);
    toast.success("Example conditions loaded");
  };

  const handleConditionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConditions(e.target.value);
    // Clear errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="conditions" className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Define Filter Conditions
            </Label>
            <p className="text-sm text-muted-foreground">
              Enter filter rules, one per line
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadExample}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Load Example
          </Button>
        </div>

        <Textarea
          id="conditions"
          placeholder={`Enter conditions (one per line):
price > 100
stock_status = instock
title != Test`}
          value={conditions}
          onChange={handleConditionsChange}
          className={`min-h-[200px] font-mono text-sm resize-none bg-background ${validationErrors.length > 0 ? 'border-destructive' : ''
            }`}
        />

        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="max-h-[200px] overflow-y-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Validation Errors:</p>
                <ul className="space-y-2 text-sm">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="border-l-2 border-destructive pl-3">
                      <span className="font-semibold">Line {error.line}:</span> {error.message}
                      <div className="mt-1 font-mono text-xs bg-destructive/10 p-2 rounded">
                        {error.text}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Supported operators:</span> = != &gt; &lt; &gt;= &lt;=
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Available Filters:</span> title, price, stock_status, stock_quantity, category, on_sale
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Value types:</span> price/stock_quantity (number), on_sale (true/false), others (text)
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="flex-1 bg-primary hover:bg-primary-hover"
          >
            {isEvaluating ? "Evaluating..." : "Evaluate Filter"}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isEvaluating}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};