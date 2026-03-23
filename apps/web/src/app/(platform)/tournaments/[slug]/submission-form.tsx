'use client';

import { trpc } from '@/trpc/client';
import { useForm } from '@tanstack/react-form';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CreateSubmissionInput,
  createSubmissionSchema,
} from '@colosseum/types';

export function SubmissionForm({ tournamentId }: { tournamentId: string }) {
  const { mutate } = trpc.submission.submit.useMutation();
  const form = useForm({
    defaultValues: {
      title: '',
      tournamentId,
    } as CreateSubmissionInput,
    validators: {
      onSubmit: createSubmissionSchema,
    },
    onSubmit: async ({ value }) => {
      mutate(value, {
        onSuccess: (data) => {
          console.log({ data });
        },
      });
    },
  });
  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Submit Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="create-tournament-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="title"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="imageUrl"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Image URL</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="create-tournament-form">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
